#!/usr/bin/env node

/**
 * 华为云 OBS 连接测试脚本
 *
 * 使用方式:
 * pnpm tsx scripts/test-huawei-obs.ts
 */

import 'dotenv/config'
import { HuaweiOBSAdapter } from '../lib/storage/adapters/huawei-obs-adapter'

async function testHuaweiOBS() {
  console.log('🧪 开始测试华为云 OBS 连接...\n')

  try {
    // 初始化客户端
    console.log('1️⃣ 初始化 OBS 客户端...')
    const obsClient = new HuaweiOBSAdapter()
    console.log('✅ 客户端初始化成功\n')

    // 健康检查
    console.log('2️⃣ 执行健康检查...')
    const isHealthy = await obsClient.healthCheck()
    if (!isHealthy) {
      throw new Error('健康检查失败 - 无法连接到 OBS 服务')
    }
    console.log('✅ 健康检查通过\n')

    // 上传测试文件
    console.log('3️⃣ 上传测试文件...')
    const testContent = Buffer.from('Hello from ArchMind! 这是一个测试文件。')
    const testKey = `test/${Date.now()}_test.txt`

    const uploadResult = await obsClient.uploadFile(testKey, testContent, {
      'x-obs-meta-purpose': 'connection-test',
      'x-obs-meta-timestamp': new Date().toISOString()
    })

    console.log('✅ 文件上传成功')
    console.log(`   对象键: ${uploadResult.objectKey}`)
    console.log(`   ETag: ${uploadResult.etag}`)
    console.log(`   大小: ${uploadResult.size} bytes\n`)

    // 检查文件是否存在
    console.log('4️⃣ 检查文件是否存在...')
    const exists = await obsClient.fileExists(testKey)
    if (!exists) {
      throw new Error('上传的文件未找到')
    }
    console.log('✅ 文件存在确认\n')

    // 生成预签名 URL
    console.log('5️⃣ 生成预签名下载 URL...')
    const presignedUrl = await obsClient.generatePresignedUrl(testKey, 300) // 5分钟有效期
    console.log('✅ 预签名 URL 生成成功')
    console.log(`   URL: ${presignedUrl.substring(0, 100)}...\n`)

    // 清理测试文件
    console.log('6️⃣ 清理测试文件...')
    await obsClient.deleteFile(testKey)
    console.log('✅ 测试文件已删除\n')

    // 验证删除
    const existsAfterDelete = await obsClient.fileExists(testKey)
    if (existsAfterDelete) {
      throw new Error('文件删除失败')
    }
    console.log('✅ 文件删除验证通过\n')

    console.log('🎉 所有测试通过!华为云 OBS 连接正常。\n')

    console.log('📋 配置信息:')
    console.log(`   Region: ${process.env.HUAWEI_OBS_REGION}`)
    console.log(`   Bucket: ${process.env.HUAWEI_OBS_BUCKET}`)
    console.log(`   Endpoint: https://obs.${process.env.HUAWEI_OBS_REGION}.myhuaweicloud.com`)

  } catch (error) {
    console.error('\n❌ 测试失败:', error instanceof Error ? error.message : error)
    console.error('\n请检查:')
    console.error('1. .env 文件中的华为云 OBS 配置是否正确')
    console.error('2. Access Key 和 Secret Key 是否有效')
    console.error('3. 桶名称是否存在且有访问权限')
    console.error('4. 网络连接是否正常')
    process.exit(1)
  }
}

// 运行测试
testHuaweiOBS()
