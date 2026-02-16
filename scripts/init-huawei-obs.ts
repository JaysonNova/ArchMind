#!/usr/bin/env node

/**
 * 华为云 OBS 桶初始化脚本
 *
 * 功能:
 * 1. 检查桶是否存在
 * 2. 如果不存在则创建桶
 * 3. 配置桶策略(私有访问)
 * 4. 配置生命周期规则(temp 桶自动过期)
 *
 * 使用方式:
 * pnpm tsx scripts/init-huawei-obs.ts
 */

import 'dotenv/config'
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3'

interface OBSBucketConfig {
  name: string
  description: string
  lifecycleDays?: number
}

const BUCKETS: OBSBucketConfig[] = [
  {
    name: 'archmind-documents',
    description: '主文档存储桶(永久保存)'
  },
  {
    name: 'archmind-temp',
    description: '临时文件存储桶(7天后自动删除)',
    lifecycleDays: 7
  },
  {
    name: 'archmind-backups',
    description: '备份文件存储桶'
  }
]

async function initHuaweiOBS() {
  console.log('🚀 开始初始化华为云 OBS 存储桶...\n')

  // 检查环境变量
  const region = process.env.HUAWEI_OBS_REGION
  const accessKey = process.env.HUAWEI_OBS_ACCESS_KEY
  const secretKey = process.env.HUAWEI_OBS_SECRET_KEY

  if (!region || !accessKey || !secretKey) {
    console.error('❌ 缺少必要的环境变量:')
    console.error('   HUAWEI_OBS_REGION')
    console.error('   HUAWEI_OBS_ACCESS_KEY')
    console.error('   HUAWEI_OBS_SECRET_KEY')
    console.error('\n请检查 .env 文件配置')
    process.exit(1)
  }

  console.log('📋 配置信息:')
  console.log(`   Region: ${region}`)
  console.log(`   Endpoint: https://obs.${region}.myhuaweicloud.com`)
  console.log(`   Access Key: ${accessKey.substring(0, 8)}...`)
  console.log()

  // 初始化 OBS 客户端
  const client = new S3Client({
    region,
    endpoint: `https://obs.${region}.myhuaweicloud.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    },
    forcePathStyle: false
  })

  // 处理每个桶
  for (const bucket of BUCKETS) {
    console.log(`📦 处理桶: ${bucket.name}`)
    console.log(`   说明: ${bucket.description}`)

    try {
      // 检查桶是否存在
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket.name }))
        console.log('   ✅ 桶已存在')
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 404) {
          // 桶不存在,创建它
          console.log('   ⏳ 桶不存在,正在创建...')

          await client.send(new CreateBucketCommand({
            Bucket: bucket.name
            // 注意: 华为云 OBS 不需要 CreateBucketConfiguration
            // 桶会在指定的 region 中创建
          }))

          console.log('   ✅ 桶创建成功')
        } else {
          throw error
        }
      }

      // 配置生命周期规则(仅针对 temp 桶)
      if (bucket.lifecycleDays) {
        console.log(`   ⏳ 配置生命周期规则(${bucket.lifecycleDays}天自动删除)...`)

        await client.send(new PutBucketLifecycleConfigurationCommand({
          Bucket: bucket.name,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'auto-delete-temp-files',
                Status: 'Enabled',
                Prefix: '',  // 应用到所有对象
                Expiration: {
                  Days: bucket.lifecycleDays
                }
              }
            ]
          }
        }))

        console.log('   ✅ 生命周期规则配置成功')
      }

      console.log()
    } catch (error) {
      console.error(`   ❌ 处理失败:`, error instanceof Error ? error.message : error)
      console.log()
    }
  }

  console.log('🎉 初始化完成!\n')
  console.log('📝 下一步:')
  console.log('   1. 运行测试: pnpm storage:test-obs')
  console.log('   2. 验证连接: pnpm storage:health')
  console.log('   3. 开始使用: 在代码中调用 getStorageClient()')
}

// 运行初始化
initHuaweiOBS().catch(error => {
  console.error('\n❌ 初始化失败:', error)
  process.exit(1)
})
