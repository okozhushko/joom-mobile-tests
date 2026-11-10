package mobile.driver;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.time.Duration;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import mobile.config.Config;

/**
 * One Appium session per test thread. The backend is picked by the APPIUM_TARGET
 * environment variable ({@code local} by default, or {@code browserstack}).
 */
@Slf4j
public final class DriverManager {
    private static final ThreadLocal<AppiumDriver> DRIVER = new ThreadLocal<>();

    private DriverManager() {
    }

    public static AppiumDriver getDriver() {
        AppiumDriver driver = DRIVER.get();
        if (driver == null) {
            driver = createDriver(Target.fromEnvironment());
            DRIVER.set(driver);
        }
        return driver;
    }

    public static void quitDriver() {
        AppiumDriver driver = DRIVER.get();
        if (driver == null) {
            return;
        }
        try {
            driver.quit();
        } finally {
            DRIVER.remove();
        }
    }

    private static AppiumDriver createDriver(Target target) {
        UiAutomator2Options options = switch (target) {
            case LOCAL -> localOptions();
            case BROWSERSTACK -> browserStackOptions();
        };
        AppiumDriver driver = new AndroidDriver(toUrl(target.serverUrl()), options);
        log.info("Appium session started on {}", target);
        return driver;
    }

    private static UiAutomator2Options localOptions() {
        return new UiAutomator2Options()
                .setDeviceName(Config.get("local.device.name"))
                .setAppPackage(Config.get("app.package"))
                .setAppActivity(Config.get("app.activity"))
                .setNewCommandTimeout(Duration.ofSeconds(Config.getInt("new.command.timeout.seconds")));
    }

    private static UiAutomator2Options browserStackOptions() {
        UiAutomator2Options options = new UiAutomator2Options()
                .setDeviceName(Config.get("browserstack.device.name"))
                .setPlatformVersion(Config.get("browserstack.os.version"))
                .setApp(Config.get("browserstack.app"))
                .setNewCommandTimeout(Duration.ofSeconds(Config.getInt("new.command.timeout.seconds")));
        options.setCapability("bstack:options", Map.of(
                "userName", Config.requireEnv("BROWSERSTACK_USERNAME"),
                "accessKey", Config.requireEnv("BROWSERSTACK_ACCESS_KEY"),
                "projectName", Config.get("browserstack.project"),
                "buildName", System.getenv().getOrDefault("CI_PIPELINE_ID", "local"),
                "debug", true));
        return options;
    }

    private static URL toUrl(String url) {
        try {
            return URI.create(url).toURL();
        } catch (IllegalArgumentException | MalformedURLException e) {
            throw new IllegalStateException("Invalid Appium server URL: " + url, e);
        }
    }

    private enum Target {
        LOCAL("local.server.url"),
        BROWSERSTACK("browserstack.server.url");

        private final String serverUrlKey;

        Target(String serverUrlKey) {
            this.serverUrlKey = serverUrlKey;
        }

        String serverUrl() {
            return Config.get(serverUrlKey);
        }

        static Target fromEnvironment() {
            String value = System.getenv().getOrDefault("APPIUM_TARGET", "local");
            try {
                return valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException("APPIUM_TARGET must be 'local' or 'browserstack', got '" + value + "'", e);
            }
        }
    }
}
