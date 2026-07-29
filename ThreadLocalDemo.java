import java.util.concurrent.*;

/**
 * ThreadLocal 演示：线程隔离 vs 线程池忘记 remove 导致串号
 * 直接运行：java ThreadLocalDemo.java
 */
public class ThreadLocalDemo {

    // 模拟「当前登录用户」上下文：每个线程独立的一份副本
    private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

    public static void main(String[] args) throws InterruptedException {
        demoIsolation();          // 场景一：正常隔离，各线程互不干扰
        demoThreadPoolCrossTalk(); // 场景二（反面）：线程池忘记 remove → 串号
        demoThreadPoolFixed();     // 场景三（正确）：try-finally remove → 无串号
    }

    // 场景一：多个线程各自 set/get，互不影响
    private static void demoIsolation() throws InterruptedException {
        System.out.println("===== 场景一：线程隔离（各自独立副本）=====");
        Thread t1 = new Thread(() -> { CURRENT_USER.set("Alice"); printUser(); }, "T1");
        Thread t2 = new Thread(() -> { CURRENT_USER.set("Bob");   printUser(); }, "T2");
        t1.start(); t2.start();
        t1.join(); t2.join();
        // 注：这里只为演示隔离效果，线程结束即销毁；生产环境仍建议 remove
    }

    // 场景二（反面教材）：单线程池复用，第一次 set 后没 remove，
    // 第二次提交没 set 却读到了上一次的脏数据 "Alice"
    private static void demoThreadPoolCrossTalk() throws InterruptedException {
        System.out.println("\n===== 场景二（反面）：线程池忘记 remove → 串号 =====");
        ExecutorService pool = Executors.newFixedThreadPool(1); // 只有 1 个线程，复用更易暴露问题
        pool.submit(() -> { CURRENT_USER.set("Alice"); printUser(); /* 忘记 remove */ });
        Thread.sleep(200);
        pool.submit(() -> printUser()); // 没 set，却读到了残留的 "Alice"
        Thread.sleep(200);
        pool.shutdown();
    }

    // 场景三（正确做法）：用 try-finally 保证 remove，复用线程也不会串号
    private static void demoThreadPoolFixed() throws InterruptedException {
        System.out.println("\n===== 场景三（正确）：try-finally remove → 无串号 =====");
        ExecutorService pool = Executors.newFixedThreadPool(1);
        pool.submit(() -> {
            try {
                CURRENT_USER.set("Alice");
                printUser();
            } finally {
                CURRENT_USER.remove(); // 用完即清，线程复用时是干净的
            }
        });
        Thread.sleep(200);
        pool.submit(() -> printUser()); // 这次读到的应是 null，而不是 "Alice"
        Thread.sleep(200);
        pool.shutdown();
    }

    private static void printUser() {
        String u = CURRENT_USER.get();
        System.out.println(Thread.currentThread().getName() + " 读到用户: " + u);
    }
}
