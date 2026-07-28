import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * 创建线程的 4 种方式 —— 面试手写/口述题
 */
public class ThreadCreateDemo {

    public static void main(String[] args) throws ExecutionException, InterruptedException {

        // 方式一：继承 Thread 类，重写 run()
        Thread t1 = new Thread() {
            @Override
            public void run() {
                System.out.println("方式一：继承 Thread -> " + Thread.currentThread().getName());
            }
        };
        t1.start();

        // 方式二：实现 Runnable 接口，更解耦（推荐任务与线程分离）
        Runnable task = () -> System.out.println("方式二：实现 Runnable -> " + Thread.currentThread().getName());
        Thread t2 = new Thread(task);
        t2.start();

        // 方式三：实现 Callable + Future，可返回结果、可抛异常
        Callable<String> callable = () -> "方式三：实现 Callable 的返回值";
        ExecutorService pool = Executors.newSingleThreadExecutor();
        Future<String> future = pool.submit(callable);
        System.out.println(future.get());
        pool.shutdown();

        // 方式四：使用线程池（实际开发最常用，控制并发、复用线程）
        ExecutorService threadPool = Executors.newFixedThreadPool(2);
        threadPool.execute(() -> System.out.println("方式四：线程池 -> " + Thread.currentThread().getName()));
        threadPool.shutdown();
    }
}
