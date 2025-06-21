/**
 * 性能检查器
 * 检查性能优化相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class PerformanceChecker extends BaseChecker {
  /**
   * 获取检查器处理的分类
   */
  getCategory(): ReviewCategory {
    return ReviewCategory.PERFORMANCE;
  }

  /**
   * 执行性能检查
   */
  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content } = fileData;

      // 检查循环优化
      issues.push(...this.checkLoopOptimization(file, content));
      
      // 检查API调用频率
      issues.push(...this.checkApiCallFrequency(file, content));
      
      // 检查缓存使用
      issues.push(...this.checkCacheUsage(file, content));
      
      // 检查数据库查询优化
      issues.push(...this.checkDatabaseQueryOptimization(file, content));
    }

    return issues;
  }

  /**
   * 检查循环优化
   */
  private checkLoopOptimization(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查嵌套循环
      if ((line.includes('for') || line.includes('while')) && i < lines.length - 5) {
        let nestedLoopFound = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().includes('for') || lines[j].trim().includes('while')) {
            nestedLoopFound = true;
            break;
          }
        }
        
        if (nestedLoopFound) {
          issues.push(this.createIssue(
            '嵌套循环性能',
            '发现嵌套循环，可能影响性能',
            file,
            IssueSeverity.MAJOR,
            lineNumber,
            '考虑优化算法复杂度或使用更高效的数据结构',
            'nested-loops'
          ));
        }
      }
      
      // 检查循环中的数据库操作
      if (line.includes('for') || line.includes('while')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes('query') || nextLine.includes('save') || 
              nextLine.includes('update') || nextLine.includes('delete')) {
            issues.push(this.createIssue(
              '循环中的数据库操作',
              '在循环中执行数据库操作，严重影响性能',
              file,
              IssueSeverity.CRITICAL,
              lineNumber,
              '使用批量操作或将查询移到循环外',
              'loop-db-operation'
            ));
            break;
          }
        }
      }
      
      // 检查循环中的集合修改
      if ((line.includes('for') || line.includes('while')) && 
          !line.includes('Iterator') && !line.includes('concurrent')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if ((nextLine.includes('remove(') || nextLine.includes('add(')) && 
              nextLine.includes('List') || nextLine.includes('Set')) {
            issues.push(this.createIssue(
              '循环中修改集合',
              '在循环中直接修改集合可能导致ConcurrentModificationException',
              file,
              IssueSeverity.MAJOR,
              j + 1,
              '使用Iterator或Java 8 Stream API进行集合操作',
              'collection-modification'
            ));
            break;
          }
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查API调用频率
   */
  private checkApiCallFrequency(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查循环中的API调用
      if (line.includes('for') || line.includes('while')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes('http') || nextLine.includes('restTemplate') || 
              nextLine.includes('webClient') || nextLine.includes('HttpClient')) {
            issues.push(this.createIssue(
              '循环中的API调用',
              '在循环中执行HTTP请求，可能导致性能问题',
              file,
              IssueSeverity.MAJOR,
              lineNumber,
              '考虑批量API调用或使用异步处理',
              'loop-api-call'
            ));
            break;
          }
        }
      }
      
      // 检查同步API调用
      if (line.includes('restTemplate.getForObject') || line.includes('restTemplate.postForObject')) {
        issues.push(this.createIssue(
          '同步API调用',
          '使用同步API调用，可能阻塞线程',
          file,
          IssueSeverity.MINOR,
          lineNumber,
          '考虑使用WebClient进行异步调用',
          'sync-api-call'
        ));
      }
      
      // 检查多个连续API调用
      if (line.includes('restTemplate') || line.includes('HttpClient') || line.includes('webClient')) {
        let apiCallCount = 1;
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes('restTemplate') || nextLine.includes('HttpClient') || nextLine.includes('webClient')) {
            apiCallCount++;
          }
        }
        
        if (apiCallCount > 2) {
          issues.push(this.createIssue(
            '多个连续API调用',
            `发现${apiCallCount}个连续API调用，可能导致性能问题`,
            file,
            IssueSeverity.MAJOR,
            lineNumber,
            '考虑使用CompletableFuture或WebClient并行调用API',
            'sequential-api-calls'
          ));
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查缓存使用
   */
  private checkCacheUsage(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    let hasExpensiveOperation = false;
    let hasCacheAnnotation = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查缓存注解
      if (line.includes('@Cacheable') || line.includes('@CacheEvict') || line.includes('@CachePut')) {
        hasCacheAnnotation = true;
      }
      
      // 检查可能需要缓存的操作
      if (line.includes('findAll') || line.includes('findBy') || 
          line.includes('getAll') || line.includes('select')) {
        hasExpensiveOperation = true;
        
        // 检查是否有对应的缓存
        let foundCache = false;
        for (let j = Math.max(0, i - 3); j < Math.min(i + 3, lines.length); j++) {
          if (lines[j].includes('@Cacheable')) {
            foundCache = true;
            break;
          }
        }
        
        if (!foundCache && !file.toLowerCase().includes('test')) {
          issues.push(this.createIssue(
            '缺少缓存优化',
            '数据库查询或API调用建议添加缓存',
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '考虑使用@Cacheable注解或Redis缓存',
            'missing-cache'
          ));
        }
      }
      
      // 检查缓存配置
      if (line.includes('@Cacheable') && !line.includes('key') && !line.includes('condition')) {
        issues.push(this.createIssue(
          '缓存配置不完整',
          '缓存注解缺少key或condition配置',
          file,
          IssueSeverity.MINOR,
          lineNumber,
          '添加key属性以优化缓存命中率',
          'cache-config'
        ));
      }
      
      // 检查缓存过期策略
      if (file.includes('CacheConfig') || file.includes('CacheManager')) {
        if (!content.includes('setTimeToLive') && !content.includes('expireAfterWrite')) {
          issues.push(this.createIssue(
            '缓存过期策略',
            '未设置缓存过期时间',
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '配置适当的缓存过期时间，避免缓存过期问题',
            'cache-expiration'
          ));
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查数据库查询优化
   */
  private checkDatabaseQueryOptimization(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查N+1查询问题
      if (line.includes('findAll') || line.includes('findBy')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes('for') && (nextLine.includes('get') || nextLine.includes('find'))) {
            issues.push(this.createIssue(
              'N+1查询问题',
              '可能存在N+1查询问题',
              file,
              IssueSeverity.MAJOR,
              lineNumber,
              '使用JOIN查询或@EntityGraph注解优化',
              'n-plus-one-query'
            ));
            break;
          }
        }
      }
      
      // 检查缺少分页的查询
      if (line.includes('findAll()') && !line.includes('Pageable')) {
        issues.push(this.createIssue(
          '缺少分页',
          'findAll查询没有分页，可能返回大量数据',
          file,
          IssueSeverity.MAJOR,
          lineNumber,
          '添加Pageable参数进行分页查询',
          'missing-pagination'
        ));
      }
      
      // 检查原生SQL查询
      if (line.includes('@Query') && line.includes('nativeQuery = true')) {
        issues.push(this.createIssue(
          '原生SQL查询',
          '使用原生SQL查询，需要注意SQL注入风险和数据库兼容性',
          file,
          IssueSeverity.MINOR,
          lineNumber,
          '优先使用JPQL或Criteria API',
          'native-query'
        ));
      }
      
      // 检查缺少索引的查询
      if (line.includes('findBy') && line.includes('Like')) {
        issues.push(this.createIssue(
          '模糊查询性能',
          '使用Like进行模糊查询，可能性能较低',
          file,
          IssueSeverity.MINOR,
          lineNumber,
          '确保字段有适当的索引，避免前缀模糊查询',
          'like-query'
        ));
      }
      
      // 检查大批量操作
      if (line.includes('deleteAll') || line.includes('saveAll')) {
        issues.push(this.createIssue(
          '大批量操作',
          '使用批量操作可能导致性能问题',
          file,
          IssueSeverity.INFO,
          lineNumber,
          '对于大数据量，考虑使用批处理或分页操作',
          'bulk-operation'
        ));
      }
    }
    
    return issues;
  }
} 