package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

@RestController
@RequestMapping("/api")
class UserController {
    
    // 这里有一些代码质量问题，用于测试代码审查功能
    
    @GetMapping("/users/{id}")
    public String getUser(@PathVariable String id) {
        // 缺少输入验证 - 安全问题
        // 直接使用字符串拼接 - 可能的SQL注入风险
        String sql = "SELECT * FROM users WHERE id = " + id;
        
        // 没有异常处理
        return executeQuery(sql);
    }
    
    @PostMapping("/users")
    public String createUser(@RequestBody String userData) {
        // 缺少参数验证
        // 没有权限检查
        
        for (int i = 0; i < 1000; i++) {
            // 低效的循环 - 性能问题
            processUserData(userData + i);
        }
        
        return "User created";
    }
    
    // 方法过长 - 可维护性问题
    public void complexMethod() {
        int a = 1;
        int b = 2;
        int c = 3;
        // ... 大量重复代码
        System.out.println(a + b + c);
        System.out.println(a + b + c);
        System.out.println(a + b + c);
        System.out.println(a + b + c);
        System.out.println(a + b + c);
    }
    
    private String executeQuery(String sql) {
        // 模拟数据库查询
        return "result";
    }
    
    private void processUserData(String data) {
        // 模拟数据处理
    }
} 