#!/usr/bin/env node

/**
 * 存储服务健康检查脚本
 *
 * 检查当前配置的存储服务(MinIO 或华为云 OBS)是否正常工作
 *
 * 使用方式:
 * pnpm tsx scripts/health-check-storage.ts
 */

import 'dotenv/config'
import { getStorageClient } from '../lib/storage/storage-factory'

async function healthCheck() {
  const provider = process.env.STORAGE_PROVIDER || 'minio'

  console.log(`🏥 存储服务健康检查`)
  console.log(`📦 当前配置: ${provider.toUpperCase()}\n`)

  try {
    const storage = getStorageClient()

    console.log('1️⃣ 初始化存储客户端...')
    console.log(`✅ ${storage.getProviderName()} 客户端初始化成功\n`)

    if (storage.healthCheck) {
      console.log('2️⃣ 执行健康检查...')
      const isHealthy = await storage.healthCheck()

      if (isHealthy) {
        console.log('✅ 健康检查通过\n')
        console.log('🎉 存储服务运行正常!')
      } else {
        console.error('❌ 健康检查失败')
        process.exit(1)
      }
    } else {
      console.log('⚠️  该存储适配器未实现健康检查方法')
    }

  } catch (error) {
    console.error('\n❌ 健康检查失败:', error instanceof Error ? error.message : error)
    console.error('\n📋 当前配置:')

    if (provider === 'minio') {
      console.error(`   MINIO_ENDPOINT: ${process.env.MINIO_ENDPOINT}`)
      console.error(`   MINIO_BUCKET_DOCUMENTS: ${process.env.MINIO_BUCKET_DOCUMENTS}`)
    } else if (provider === 'huawei-obs') {
      console.error(`   HUAWEI_OBS_REGION: ${process.env.HUAWEI_OBS_REGION}`)
      console.error(`   HUAWEI_OBS_BUCKET: ${process.env.HUAWEI_OBS_BUCKET}`)
    }

    process.exit(1)
  }
}

healthCheck()
