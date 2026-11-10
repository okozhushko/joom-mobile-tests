package tests;

import io.appium.java_client.AppiumDriver;
import mobile.driver.DriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

/** Starts a fresh Appium session (and so a freshly reset app) for every test. */
public abstract class BaseTest {

    protected AppiumDriver driver;

    @BeforeEach
    void startSession() {
        driver = DriverManager.getDriver();
    }

    @AfterEach
    void endSession() {
        DriverManager.quitDriver();
    }
}
