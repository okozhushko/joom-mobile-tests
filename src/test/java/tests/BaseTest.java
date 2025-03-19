package tests;

import io.appium.java_client.AppiumDriver;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import mobile.Initializer;
import mobile.helper.Helper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

@Slf4j
public class BaseTest {

    protected static AppiumDriver driver;

    @BeforeEach
    @SneakyThrows
    public void setUp() {
        log.info("Driver: Initializing before test\n");
        driver = Initializer.getDriver();
        Helper.setDriver(driver);
        Thread.sleep(2000);

        log.info("Starting test\n");
    }

    @AfterEach
    public void tearDown() {
        log.info("Closing after test\n");
        Initializer.quitDriver();
    }
}
