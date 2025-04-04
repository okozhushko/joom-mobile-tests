package mobile;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.remote.MobileCapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.Properties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class Initializer {
    private static AppiumDriver driver;
    private static final Properties config = new Properties();

    static {
        try (InputStream input = Initializer.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                log.error("Unable to find config.properties");
            }
            config.load(input);
        } catch (Exception ex) {
            log.error("Failed to load configuration", ex);
            throw new RuntimeException(ex);
        }
    }

    public static AppiumDriver getDriver() {
        if (driver == null) {
            initDriver();
        }
        return driver;
    }

    private static void initDriver() {
        if (!localInitialization() && !bStackInitialization()) {
            log.error("Failed to initialize any driver");
            throw new RuntimeException("No available drivers");
        }
    }

    private static boolean localInitialization() {
        try {
            URI appiumServerURI = new URI(config.getProperty("appium.server.url"));
            URL appiumServerURL = appiumServerURI.toURL();
            DesiredCapabilities capabilities = getLocalDesiredCapabilities();
            driver = new AndroidDriver(appiumServerURL, capabilities);
            log.info("Local driver initialized successfully");
            return true;
        } catch (Exception e) {
            log.debug("Local driver initialization failed", e);
            return false;
        }
    }

    private static DesiredCapabilities getLocalDesiredCapabilities() {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability(MobileCapabilityType.DEVICE_NAME, config.getProperty("device.name"));
        capabilities.setCapability(MobileCapabilityType.PLATFORM_NAME, config.getProperty("platform.name"));
        capabilities.setCapability("appPackage", config.getProperty("app.package"));
        capabilities.setCapability("appActivity", config.getProperty("app.activity"));
        capabilities.setCapability(MobileCapabilityType.AUTOMATION_NAME, config.getProperty("automation.name"));
        capabilities.setCapability(MobileCapabilityType.NEW_COMMAND_TIMEOUT, Integer.parseInt(config.getProperty("new.command.timeout")));
        return capabilities;
    }

    private static boolean bStackInitialization() {
        try {
            URI uri = new URI("https://" + config.getProperty("bs_userName") + ":" + config.getProperty("bs_accessKey") + "@hub-cloud.browserstack.com/wd/hub");
            URL appiumServerURL = uri.toURL();
            DesiredCapabilities capabilities = getBStackDesiredCapabilities();
            driver = new AndroidDriver(appiumServerURL, capabilities);
            log.info("BrowserStack driver initialized successfully");
            return true;
        } catch (Exception e) {
            log.error("BrowserStack driver initialization failed", e);
            return false;
        }
    }

    private static DesiredCapabilities getBStackDesiredCapabilities() {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability("browserstack.user", config.getProperty("bs_userName"));
        capabilities.setCapability("browserstack.key", config.getProperty("bs_accessKey"));
        capabilities.setCapability(MobileCapabilityType.DEVICE_NAME, config.getProperty("deviceName"));
        capabilities.setCapability(MobileCapabilityType.PLATFORM_NAME, config.getProperty("platformName"));
        capabilities.setCapability("os_version", config.getProperty("os_version"));
        capabilities.setCapability("app", config.getProperty("app"));
        capabilities.setCapability("project", config.getProperty("project"));
        capabilities.setCapability("build", config.getProperty("build"));
        capabilities.setCapability("name", config.getProperty("name"));
        capabilities.setCapability("browserstack.debug", "true");
        return capabilities;
    }

    public static void quitDriver() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }
}
