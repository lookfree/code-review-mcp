/**
 * 数据库检查器
 * 检查数据库操作相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class DatabaseChecker extends BaseChecker {
  /**
   * 获取检查器处理的分类
   */
  getCategory(): ReviewCategory {
    return ReviewCategory.DATABASE;
  }

  /**
   * 执行数据库检查
   */
  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      // 检查事务管理
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('@Transactional') && !line.includes('rollbackFor')) {
          issues.push(this.createIssue(
            '事务回滚配置',
            '@Transactional注解建议指定rollbackFor属性',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '添加rollbackFor = Exception.class',
            'transaction-rollback'
          ));
        }
        
        if (line.includes('findAll()') && !line.includes('Pageable')) {
          issues.push(this.createIssue(
            '缺少分页',
            'findAll查询没有分页，可能返回大量数据',
            file,
            IssueSeverity.MAJOR,
            i + 1,
            '添加Pageable参数进行分页查询',
            'missing-pagination'
          ));
        }
      }
      
      // 检查连接池配置
      issues.push(...this.checkConnectionPool(file, content));
      
      // 检查索引优化
      issues.push(...this.checkIndexOptimization(file, content));
      
      // 检查SQL查询
      issues.push(...this.checkSqlQueries(file, content));
      
      // 检查ORM使用
      issues.push(...this.checkOrmUsage(file, content));
    }

    return issues;
  }

  /**
   * 检查连接池配置
   */
  private checkConnectionPool(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查是否使用了连接池
    if ((file.includes('DataSource') || file.includes('database')) && 
        content.includes('new') && content.includes('Connection')) {
      
      // 检查是否直接创建连接而不是使用连接池
      if (!content.includes('DataSource') && !content.includes('ConnectionPool')) {
        issues.push(this.createIssue(
          '缺少连接池',
          '直接创建数据库连接而不是使用连接池',
          file,
          IssueSeverity.MAJOR,
          undefined,
          '使用HikariCP、Tomcat或Commons DBCP连接池',
          'missing-connection-pool'
        ));
      }
    }
    
    // 检查连接池配置
    if (file.includes('application.') || file.includes('DataSource')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;
        
        // 检查连接池大小配置
        if (line.includes('maximum-pool-size') || line.includes('maxActive') || 
            line.includes('max-active') || line.includes('maxPoolSize')) {
          
          const sizeMatch = line.match(/\d+/);
          if (sizeMatch) {
            const poolSize = parseInt(sizeMatch[0]);
            if (poolSize > 50) {
              issues.push(this.createIssue(
                '连接池大小',
                `连接池大小 ${poolSize} 可能过大`,
                file,
                IssueSeverity.MINOR,
                lineNumber,
                '对于大多数应用，连接池大小应该在10-20之间',
                'connection-pool-size'
              ));
            }
          }
        }
        
        // 检查连接超时配置
        if (!content.includes('timeout') && !content.includes('idle-timeout') && 
            !content.includes('max-wait')) {
          issues.push(this.createIssue(
            '连接超时配置',
            '可能缺少连接超时配置',
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '添加连接超时和最大等待时间配置',
            'connection-timeout'
          ));
          break;
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查索引优化
   */
  private checkIndexOptimization(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查实体类中的索引注解
    if (file.endsWith('Entity.java') || content.includes('@Entity')) {
      let hasIndex = content.includes('@Index') || content.includes('@Indexed');
      
      // 检查常用于查询的字段是否有索引
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;
        
        // 检查查询方法中使用的字段是否有索引
        if ((line.includes('findBy') || line.includes('where')) && 
            !hasIndex && !content.includes('@Id')) {
          
          const fieldMatch = line.match(/findBy(\w+)/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            
            // 检查该字段是否有索引注解
            let fieldHasIndex = false;
            for (let j = 0; j < lines.length; j++) {
              if (lines[j].includes(`@Index`) && lines[j].includes(fieldName.toLowerCase())) {
                fieldHasIndex = true;
                break;
              }
            }
            
            if (!fieldHasIndex) {
              issues.push(this.createIssue(
                '缺少索引',
                `字段 ${fieldName} 用于查询但可能缺少索引`,
                file,
                IssueSeverity.MINOR,
                lineNumber,
                '为频繁查询的字段添加索引',
                'missing-index'
              ));
            }
          }
        }
        
        // 检查复合索引需求
        if (line.includes('findBy') && line.includes('And')) {
          const fieldsMatch = line.match(/findBy(\w+)And(\w+)/);
          if (fieldsMatch) {
            const field1 = fieldsMatch[1];
            const field2 = fieldsMatch[2];
            
            // 检查是否有复合索引
            let hasCompositeIndex = false;
            for (let j = 0; j < lines.length; j++) {
              if (lines[j].includes(`@Index`) && 
                  lines[j].includes(field1.toLowerCase()) && 
                  lines[j].includes(field2.toLowerCase())) {
                hasCompositeIndex = true;
                break;
              }
            }
            
            if (!hasCompositeIndex) {
              issues.push(this.createIssue(
                '缺少复合索引',
                `联合查询字段 ${field1} 和 ${field2} 可能需要复合索引`,
                file,
                IssueSeverity.MINOR,
                lineNumber,
                '考虑为联合查询字段创建复合索引',
                'composite-index'
              ));
            }
          }
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查SQL查询
   */
  private checkSqlQueries(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查SELECT *
      if (line.includes('SELECT *') || line.includes('select *')) {
        issues.push(this.createIssue(
          'SELECT *查询',
          '使用SELECT *可能导致性能问题',
          file,
          IssueSeverity.MINOR,
          lineNumber,
          '明确指定需要的列，避免使用SELECT *',
          'select-star'
        ));
      }
      
      // 检查JOIN查询
      if ((line.includes('JOIN') || line.includes('join')) && 
          !line.includes('INNER JOIN') && !line.includes('inner join') && 
          !line.includes('LEFT JOIN') && !line.includes('left join')) {
        issues.push(this.createIssue(
          'JOIN类型',
          '未明确指定JOIN类型',
          file,
          IssueSeverity.INFO,
          lineNumber,
          '明确指定JOIN类型（INNER JOIN或LEFT JOIN等）',
          'join-type'
        ));
      }
      
      // 检查ORDER BY
      if ((line.includes('ORDER BY') || line.includes('order by')) && 
          !line.includes('INDEX') && !line.includes('index')) {
        issues.push(this.createIssue(
          'ORDER BY性能',
          'ORDER BY可能没有使用索引',
          file,
          IssueSeverity.INFO,
          lineNumber,
          '确保ORDER BY子句使用了索引列',
          'order-by'
        ));
      }
      
      // 检查IN子句
      if ((line.includes(' IN ') || line.includes(' in ')) && 
          line.includes('(') && line.includes(')')) {
        
        // 检查IN子句中的元素数量
        const inClauseMatch = line.match(/IN\s*\(([^)]+)\)/i);
        if (inClauseMatch) {
          const inClauseContent = inClauseMatch[1];
          const elementCount = inClauseContent.split(',').length;
          
          if (elementCount > 100) {
            issues.push(this.createIssue(
              'IN子句大小',
              `IN子句包含${elementCount}个元素，可能导致性能问题`,
              file,
              IssueSeverity.MAJOR,
              lineNumber,
              '考虑分批查询或使用JOIN代替大型IN子句',
              'in-clause-size'
            ));
          }
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查ORM使用
   */
  private checkOrmUsage(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查JPA实体类配置
    if (file.endsWith('Entity.java') || content.includes('@Entity')) {
      // 检查是否有无参构造函数
      if (!content.includes('public') && !content.includes('protected') && 
          content.includes('constructor') && !content.includes('()')) {
        issues.push(this.createIssue(
          '缺少无参构造函数',
          'JPA实体类缺少无参构造函数',
          file,
          IssueSeverity.MAJOR,
          undefined,
          'JPA要求实体类有一个无参构造函数',
          'no-arg-constructor'
        ));
      }
      
      // 检查是否实现了Serializable
      if (!content.includes('implements Serializable')) {
        issues.push(this.createIssue(
          '未实现Serializable',
          'JPA实体类建议实现Serializable接口',
          file,
          IssueSeverity.MINOR,
          undefined,
          '实现Serializable接口以支持实体的序列化',
          'serializable'
        ));
      }
      
      // 检查是否使用了懒加载
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;
        
        if ((line.includes('@OneToMany') || line.includes('@ManyToMany')) && 
            !line.includes('fetch = FetchType.LAZY')) {
          issues.push(this.createIssue(
            '集合关联默认加载',
            '集合关联没有显式设置为懒加载',
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '设置fetch = FetchType.LAZY避免性能问题',
            'lazy-loading'
          ));
        }
      }
    }
    
    // 检查Repository接口
    if (file.endsWith('Repository.java') || file.endsWith('Dao.java')) {
      // 检查是否有自定义查询方法
      let hasCustomQuery = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('@Query')) {
          hasCustomQuery = true;
          break;
        }
      }
      
      if (!hasCustomQuery && file.length > 500) {
        issues.push(this.createIssue(
          '缺少自定义查询',
          '大型Repository可能缺少自定义查询优化',
          file,
          IssueSeverity.INFO,
          undefined,
          '考虑使用@Query注解优化复杂查询',
          'custom-query'
        ));
      }
    }
    
    return issues;
  }
}
