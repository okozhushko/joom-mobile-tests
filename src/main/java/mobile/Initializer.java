package mobile;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.remote.MobileCapabilityType;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.Properties;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.remote.DesiredCapabilities;

@Slf4j
public class Initializer {
    private static AppiumDriver driver;
    static Properties config = new Properties();

    static {
        try (InputStream input = Initializer.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                Initializer.log.error("Unable to find config.properties");
            }

            config.load(input);
        } catch (Exception ex) {
            log.error("Failed to load configuration", ex);
            throw new ExceptionInInitializerError();
        }
    }

    private static void initDriver() {
        try {
            URI appiumServerURI = new URI(config.getProperty("appium.server.url"));
            URL appiumServerURL = appiumServerURI.toURL();
            driver = new AndroidDriver(appiumServerURL, getDesiredCapabilities());
            log.info("Driver initialized successfully");
        } catch (Exception e) {
            log.error("Driver initialization failed", e);
            throw new RuntimeException(e);
        }
    }

    private static DesiredCapabilities getDesiredCapabilities() {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability(MobileCapabilityType.DEVICE_NAME, config.getProperty("device.name"));
        capabilities.setCapability(MobileCapabilityType.PLATFORM_NAME, config.getProperty("platform.name"));
        capabilities.setCapability("appPackage", config.getProperty("app.package"));
        capabilities.setCapability("appActivity", config.getProperty("app.activity"));
        capabilities.setCapability(MobileCapabilityType.AUTOMATION_NAME, config.getProperty("automation.name"));
        capabilities.setCapability(MobileCapabilityType.NEW_COMMAND_TIMEOUT, config.getProperty("new.command.timeout"));
        return capabilities;
    }

    public static void quitDriver() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }
}
