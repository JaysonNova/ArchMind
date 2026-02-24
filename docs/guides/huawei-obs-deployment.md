# 华为云 OBS 对象存储部署指南

## 概述

ArchMind 使用华为云对象存储服务（OBS）作为存储后端。

## 架构

```
StorageAdapter 接口
    └── HuaweiOBSAdapter (华为云 OBS)
```

**优点:**
- 生产环境使用华为云 OBS，高可用、高性能
- 代码无需修改，仅需配置环境变量
- 支持未来扩展到阿里云 OSS、腾讯云 COS 等

## 前置条件

### 1. 华为云账号准备

1. 注册华为云账号: https://www.huaweicloud.com
2. 实名认证(必需)
3. 开通对象存储服务 OBS

### 2. 创建 OBS 桶

**控制台创建:**
1. 登录华为云控制台
2. 进入【对象存储服务 OBS】
3. 点击【创建桶】
4. 配置:
   - 桶名称: `archmind-documents` (全局唯一)
   - 区域: `华北-北京四` (cn-north-4) 或其他区域
   - 存储类别: `标准存储`
   - 桶策略: `私有` (推荐)
5. 创建完成

**建议创建 3 个桶:**
- `archmind-documents` - 主文档存储(标准存储)
- `archmind-temp` - 临时文件(标准存储 + 生命周期规则)
- `archmind-backups` - 备份文件(归档存储)

### 3. 获取访问密钥

**创建 Access Key:**
1. 控制台右上角 → 【我的凭证】
2. 左侧菜单 → 【访问密钥】
3. 点击【新增访问密钥】
4. 下载 `credentials.csv` 文件(包含 AK/SK)

**安全建议:**
- 不要将 AK/SK 提交到代码仓库
- 使用 IAM 子账号,仅授予 OBS 权限
- 定期轮换访问密钥

## 配置步骤

### 1. 环境变量配置

编辑 `.env` 文件:

```bash
# 对象存储配置
STORAGE_PROVIDER=huawei-obs

# 华为云 OBS 配置
HUAWEI_OBS_REGION=cn-north-4          # 华北-北京四
HUAWEI_OBS_ACCESS_KEY=your_ak_here    # 替换为你的 Access Key
HUAWEI_OBS_SECRET_KEY=your_sk_here    # 替换为你的 Secret Key
HUAWEI_OBS_BUCKET=archmind-documents  # 桶名称
```

**可用区域列表:**
| 区域名称 | Region ID | Endpoint |
|---------|-----------|----------|
| 华北-北京四 | cn-north-4 | obs.cn-north-4.myhuaweicloud.com |
| 华东-上海一 | cn-east-3 | obs.cn-east-3.myhuaweicloud.com |
| 华南-广州 | cn-south-1 | obs.cn-south-1.myhuaweicloud.com |
| 西南-贵阳一 | cn-southwest-2 | obs.cn-southwest-2.myhuaweicloud.com |

### 2. 依赖安装

华为云 OBS 通过 AWS SDK 的 S3 兼容 API 访问:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 3. 测试连接

**方式一: 使用健康检查脚本**
```bash
# 确保 STORAGE_PROVIDER=huawei-obs
pnpm tsx scripts/health-check-storage.ts
```

**方式二: 使用华为云 OBS 专用测试脚本**
```bash
pnpm tsx scripts/test-huawei-obs.ts
```

**预期输出:**
```
🧪 开始测试华为云 OBS 连接...

1️⃣ 初始化 OBS 客户端...
✅ 客户端初始化成功

2️⃣ 执行健康检查...
✅ 健康检查通过

3️⃣ 上传测试文件...
✅ 文件上传成功
   对象键: test/1234567890_test.txt
   ETag: "abcd1234..."
   大小: 58 bytes

...

🎉 所有测试通过!华为云 OBS 连接正常。
```

## 代码集成

### 自动切换存储后端

代码中使用 `getStorageClient()` 工厂函数,会根据 `STORAGE_PROVIDER` 环境变量自动选择存储后端:

```typescript
import { getStorageClient } from '~/lib/storage/storage-factory'

export default defineEventHandler(async (event) => {
  // 根据环境变量选择华为云 OBS
  const storage = getStorageClient()

  // 上传文件
  const result = await storage.uploadFile(
    'documents/example.pdf',
    fileBuffer,
    { 'Content-Type': 'application/pdf' }
  )

  // 生成下载链接
  const downloadUrl = await storage.generatePresignedUrl(
    'documents/example.pdf',
    3600  // 1小时有效期
  )

  return { success: true, url: downloadUrl }
})
```

**配置:**
- 生产环境用华为云 OBS（`STORAGE_PROVIDER=huawei-obs`）

## 生产部署最佳实践

### 1. 环境配置

**生产环境 (.env):**
```bash
STORAGE_PROVIDER=huawei-obs
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=${SECRET_AK}   # 从密钥管理服务读取
HUAWEI_OBS_SECRET_KEY=${SECRET_SK}
```

### 2. 安全加固

**使用 IAM 子账号:**
```json
{
  "Version": "1.1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "obs:object:PutObject",
        "obs:object:GetObject",
        "obs:object:DeleteObject",
        "obs:bucket:HeadBucket"
      ],
      "Resource": [
        "obs:*:*:object:archmind-documents/*"
      ]
    }
  ]
}
```

**最小权限原则:**
- 仅授予必需的 OBS 权限
- 不要使用主账号 AK/SK
- 使用 VPC Endpoint 访问 OBS(内网流量免费)

### 3. 生命周期管理

为临时文件桶设置自动过期策略:

**控制台配置:**
1. 进入桶 `archmind-temp`
2. 【生命周期规则】→【创建】
3. 规则:
   - 前缀: `temp/`
   - 过期时间: 7 天
   - 操作: 删除对象

**效果:** 7 天后自动删除临时文件,节省存储成本。

### 4. 跨域配置(可选)

如果前端直传文件到 OBS,需要配置 CORS:

```json
[
  {
    "AllowedOrigin": ["https://yourdomain.com"],
    "AllowedMethod": ["GET", "PUT", "POST"],
    "AllowedHeader": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. CDN 加速(可选)

为频繁访问的文档配置华为云 CDN:

1. 开通华为云 CDN 服务
2. 创建加速域名,源站指向 OBS 桶域名
3. 修改代码,生成 CDN URL 替代预签名 URL

```typescript
// 开发环境: 预签名 URL
const url = await storage.generatePresignedUrl(objectKey)

// 生产环境: CDN URL
const cdnUrl = `https://cdn.yourdomain.com/${objectKey}`
```

## 成本估算

### 存储费用(标准存储)
- 华北-北京四: ¥0.099/GB/月
- 示例: 100GB 文档 = ¥9.9/月

### 流量费用
- 内网流量: 免费(推荐使用 VPC Endpoint)
- 外网下载: ¥0.50/GB
- CDN 流量: ¥0.24/GB(更便宜)

### 请求费用
- PUT/POST 请求: ¥0.01/千次
- GET 请求: ¥0.01/千次

**成本优化建议:**
- 使用 VPC Endpoint 访问 OBS(内网免费)
- 配置 CDN 加速(降低流量成本)
- 设置生命周期规则清理临时文件
- 使用归档存储保存冷数据

## 监控与告警

### 1. OBS 监控指标

在华为云云监控服务中查看:
- 存储量趋势
- 请求次数
- 错误率
- 下载/上传流量

### 2. 应用层监控

在代码中添加指标采集:

```typescript
export class HuaweiOBSAdapter implements StorageAdapter {
  async uploadFile(objectKey: string, fileBuffer: Buffer) {
    const startTime = Date.now()

    try {
      const result = await this.client.send(command)

      // 记录成功指标
      metrics.record('obs.upload.success', Date.now() - startTime)

      return result
    } catch (error) {
      // 记录失败指标
      metrics.record('obs.upload.error', 1)
      throw error
    }
  }
}
```

### 3. 告警规则

建议配置的告警:
- OBS 错误率 > 1%
- 单小时上传失败次数 > 10
- 存储空间使用率 > 80%

## 数据迁移

如需从其他存储迁移到华为云 OBS，请参考以下步骤：

1. **确保华为云 OBS 配置正确:**
```bash
pnpm tsx scripts/test-huawei-obs.ts
```

2. **切换环境变量:**
```bash
# .env
STORAGE_PROVIDER=huawei-obs
```

3. **测试应用功能:**
- 上传新文档
- 下载现有文档
- 删除测试文档

## 故障排查

### 1. 连接超时

**问题:** `Request timeout`

**解决:**
- 检查服务器网络是否能访问华为云
- 确认 Region 配置正确
- 使用 VPC Endpoint(如果是华为云 ECS)

### 2. 403 权限错误

**问题:** `Access Denied`

**解决:**
- 检查 AK/SK 是否正确
- 确认 IAM 权限是否足够
- 检查桶策略是否允许访问

### 3. 404 桶不存在

**问题:** `NoSuchBucket`

**解决:**
- 确认桶名称拼写正确
- 检查桶是否在指定 Region
- 验证账号是否有访问权限

### 4. 签名错误

**问题:** `SignatureDoesNotMatch`

**解决:**
- 确认 Secret Key 正确(不要有空格)
- 检查系统时间是否准确
- 重新生成 Access Key

## 参考资料

- [华为云 OBS 官方文档](https://support.huaweicloud.com/obs/index.html)
- [OBS 快速入门](https://support.huaweicloud.com/intl/zh-cn/qs-obs/obs_qs_0011.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 兼容 API 说明](https://support.huaweicloud.com/intl/zh-cn/s3api-obs/obs_04_0001.html)

## 支持

如有问题,请提交 Issue 或联系技术支持。
