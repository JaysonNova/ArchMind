/**
 * 图片生成模型提供商定义
 * 定义所有支持的 AI 图片生成提供商及其配置
 */

import type { ImageProviderConfig } from '~/types/settings'

export const IMAGE_PROVIDERS: Record<string, ImageProviderConfig> = {
  wanx: {
    id: 'wanx',
    name: '阿里云通义万象',
    description: '阿里云通义万象图片生成模型，支持文生图、图片编辑、风格化等多种功能。',
    website: 'https://dashscope.console.aliyun.com/apiKey',
    authType: 'api_key',
    apiKeyPlaceholder: 'sk-...',
    models: [
      {
        id: 'wanx2.1-t2i-turbo',
        name: '通义万象 2.1 Turbo',
        description: '快速文生图模型，适合快速原型设计',
        capabilities: {
          maxResolution: '2048x2048',
          supportedSizes: ['1024*1024', '720*1280', '1280*720', '960*1280', '1280*960'],
          supportsEdit: false,
          supportsInpaint: false
        },
        costEstimate: {
          perImage: '¥0.04/张'
        }
      },
      {
        id: 'wanx2.1-t2i-plus',
        name: '通义万象 2.1 Plus',
        description: '高质量文生图模型，细节更丰富',
        capabilities: {
          maxResolution: '2048x2048',
          supportedSizes: ['1024*1024', '720*1280', '1280*720', '960*1280', '1280*960'],
          supportsEdit: false,
          supportsInpaint: false
        },
        costEstimate: {
          perImage: '¥0.08/张'
        }
      },
      {
        id: 'wanx2.1-imageedit',
        name: '通义万象 2.1 编辑',
        description: '图片编辑模型，支持风格化、超分、扩展、inpaint等',
        capabilities: {
          maxResolution: '4096x4096',
          supportedSizes: ['512*512', '1024*1024', '2048*2048'],
          supportsEdit: true,
          supportsInpaint: true
        },
        costEstimate: {
          perImage: '¥0.06/张'
        }
      },
      {
        id: 'flux-schnell',
        name: 'FLUX Schnell',
        description: '高质量快速生成模型，4步推理',
        capabilities: {
          maxResolution: '1024x1024',
          supportedSizes: ['512*1024', '768*512', '768*1024', '1024*576', '576*1024', '1024*1024'],
          supportsEdit: false,
          supportsInpaint: false
        },
        costEstimate: {
          perImage: '¥0.04/张'
        }
      }
    ]
  },
  'dall-e': {
    id: 'dall-e',
    name: 'OpenAI DALL-E',
    description: 'OpenAI 图片生成模型，创意性强。',
    website: 'https://platform.openai.com/api-keys',
    authType: 'api_key',
    apiKeyPlaceholder: 'sk-...',
    models: [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: '最新版本，高质量图片生成',
        capabilities: {
          maxResolution: '1792x1024',
          supportedSizes: ['1024*1024', '1792*1024', '1024*1792'],
          supportsEdit: true,
          supportsInpaint: false
        },
        costEstimate: {
          perImage: '$0.04/张'
        }
      }
    ]
  }
}

/**
 * 获取所有图片生成提供商列表
 */
export function getAllImageProviders(): ImageProviderConfig[] {
  return Object.values(IMAGE_PROVIDERS)
}

/**
 * 获取指定图片生成提供商的配置
 */
export function getImageProviderConfig(providerId: string): ImageProviderConfig | null {
  return IMAGE_PROVIDERS[providerId] || null
}

/**
 * 根据模型 ID 查找图片生成提供商
 */
export function findImageProviderByModelId(modelId: string): ImageProviderConfig | null {
  for (const provider of Object.values(IMAGE_PROVIDERS)) {
    if (provider.models.some(m => m.id === modelId)) {
      return provider
    }
  }
  return null
}

/**
 * 获取所有可用的图片生成模型
 */
export function getAvailableImageModels(): Array<{ providerId: string; providerName: string; model: ImageProviderConfig['models'][0] }> {
  const models: Array<{ providerId: string; providerName: string; model: ImageProviderConfig['models'][0] }> = []

  for (const provider of Object.values(IMAGE_PROVIDERS)) {
    for (const model of provider.models) {
      models.push({
        providerId: provider.id,
        providerName: provider.name,
        model
      })
    }
  }

  return models
}
