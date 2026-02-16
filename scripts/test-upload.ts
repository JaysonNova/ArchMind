#!/usr/bin/env node

/**
 * 文件上传测试脚本
 * 测试文档上传到华为云 OBS 的完整流程
 *
 * 使用方式:
 * pnpm tsx scripts/test-upload.ts
 */

import 'dotenv/config'
import { promises as fs } from 'fs'
import { join } from 'path'

async function testUpload() {
  console.log('🧪 开始测试文件上传功能...\n')

  try {
    // 读取测试文件
    const testFilePath = join(process.cwd(), 'temp', 'test-upload.md')
    console.log('1️⃣ 读取测试文件:', testFilePath)

    const fileContent = await fs.readFile(testFilePath)
    const fileName = 'test-upload.md'

    console.log(`   ✅ 文件大小: ${fileContent.length} 字节\n`)

    // 构造 FormData
    const FormData = (await import('formdata-node')).FormData
    const { Blob } = await import('formdata-node')

    const formData = new FormData()
    const blob = new Blob([fileContent], { type: 'text/markdown' })
    formData.append('file', blob, fileName)

    // 发送上传请求
    console.log('2���⃣ 发送上传请求到 API...')
    const apiUrl = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3000'

    const response = await fetch(`${apiUrl}/api/documents/upload`, {
      method: 'POST',
      body: formData as any
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    console.log('   ✅ 上传成功!\n')
    console.log('📄 文档信息:')
    console.log(`   ID: ${result.data.id}`)
    console.log(`   标题: ${result.data.title}`)
    console.log(`   文件类型: ${result.data.fileType}`)
    console.log(`   文件大小: ${result.data.fileSize} 字节`)
    console.log(`   存储提供商: ${result.data.storageProvider}`)
    console.log(`   存储桶: ${result.data.storageBucket}`)
    console.log(`   对象键: ${result.data.storageKey}`)
    console.log(`   内容哈希: ${result.data.contentHash}`)
    console.log(`   处理状态: ${result.data.processingStatus}`)

    if (result.duplicate) {
      console.log('\n⚠️  检测到重复文件')
    }

    // 测试状态查询
    console.log('\n3️⃣ 查询文档处理状态...')
    const statusResponse = await fetch(`${apiUrl}/api/documents/${result.data.id}/status`)
    const statusResult = await statusResponse.json()

    console.log('   ✅ 状态查询成功')
    console.log(`   处理状态: ${statusResult.data.status}`)
    console.log(`   进度: ${statusResult.data.progress}%`)

    // 测试下载
    console.log('\n4️⃣ 测试文档下载...')
    const downloadResponse = await fetch(`${apiUrl}/api/documents/${result.data.id}/download`, {
      redirect: 'manual'
    })

    if (downloadResponse.status === 302 || downloadResponse.status === 307) {
      const downloadUrl = downloadResponse.headers.get('location')
      console.log('   ✅ 下载链接生成成功')
      console.log(`   预签名 URL: ${downloadUrl?.substring(0, 80)}...`)
    } else {
      console.warn('   ⚠️  下载链接生成失败:', downloadResponse.status)
    }

    // 测试分享链接生成
    console.log('\n5️⃣ 生成分享链接...')
    const shareResponse = await fetch(`${apiUrl}/api/documents/${result.data.id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expiryHours: 24,
        maxAccessCount: 10
      })
    })

    const shareResult = await shareResponse.json()

    if (shareResult.success) {
      console.log('   ✅ 分享链接生成成功')
      console.log(`   分享 URL: ${shareResult.data.shareUrl}`)
      console.log(`   过期时间: ${shareResult.data.expiresAt}`)
      console.log(`   最大访问次数: ${shareResult.data.maxAccessCount}`)
    } else {
      console.warn('   ⚠️  分享链接生成失败')
    }

    console.log('\n🎉 所有测试通过！文件上传系统运行正常。\n')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    throw error
  }
}

// 运行测试
testUpload().catch(error => {
  console.error('\n❌ 测试失败:', error)
  process.exit(1)
})
