/**
 * 文本分块器
 * 使用递归字符分块的方式将长文本分割成较小的块
 */

export interface SplitterOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export class TextSplitter {
  private chunkSize: number
  private chunkOverlap: number
  private separators: string[]

  constructor (options: SplitterOptions) {
    this.chunkSize = options.chunkSize
    this.chunkOverlap = options.chunkOverlap
    this.separators = options.separators || ['\n\n', '\n', ' ', '']
  }

  /**
   * 将文本分割成块
   */
  split (text: string): string[] {
    return this.splitText(text, this.separators)
  }

  private splitText (text: string, separators: string[]): string[] {
    const goodSplits: string[] = []
    const separatorIndex = separators.findIndex(s => s === '' || text.includes(s))
    const separator = separators[separatorIndex]

    let splits: string[] = []
    if (separator === '') {
      splits = Array.from(text)
    } else {
      splits = text.split(separator)
    }

    // 现在去掉好的分割
    const goodSplits2: string[] = []
    for (const s of splits) {
      if (s.length < this.chunkSize) {
        goodSplits2.push(s)
      } else {
        if (goodSplits2.length > 0) {
          const mergedText = this.mergeSplits(goodSplits2, separator)
          goodSplits.push(...mergedText)
          goodSplits2.length = 0
        }
        if (separatorIndex === separators.length - 1) {
          goodSplits.push(s)
        } else {
          const otherInfo = this.splitText(s, separators.slice(separatorIndex + 1))
          goodSplits.push(...otherInfo)
        }
      }
    }

    if (goodSplits2.length > 0) {
      const mergedText = this.mergeSplits(goodSplits2, separator)
      goodSplits.push(...mergedText)
    }

    return goodSplits.filter(x => x.length > 0)
  }

  private mergeSplits (splits: string[], separator: string): string[] {
    const separatorLen = separator.length
    const goodSplits: string[] = []
    let currentMerge: string[] = []
    let totalLen = 0

    for (const s of splits) {
      const len = s.length
      if (totalLen + len + separatorLen > this.chunkSize) {
        if (currentMerge.length > 0) {
          const mergedText = currentMerge.join(separator)
          if (mergedText.trim().length > 0) {
            goodSplits.push(mergedText)
          }
          // 保持重叠
          currentMerge = []
          totalLen = 0

          // 检查是否需要保留最后一个元素用于重叠
          if (len > this.chunkSize) {
            goodSplits.push(s)
          } else {
            currentMerge = [s]
            totalLen = len + separatorLen
          }
        } else if (len > this.chunkSize) {
          goodSplits.push(s)
        } else {
          currentMerge = [s]
          totalLen = len + separatorLen
        }
      } else {
        currentMerge.push(s)
        totalLen += len + separatorLen
      }
    }

    if (currentMerge.length > 0) {
      const mergedText = currentMerge.join(separator)
      if (mergedText.trim().length > 0) {
        goodSplits.push(mergedText)
      }
    }

    return goodSplits
  }
}
