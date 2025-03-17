package mobile.helper;

import io.appium.java_client.AppiumDriver;
import lombok.Setter;

public class Helper {

    @Setter
    private static AppiumDriver driver;

    public static Boolean isTextOnScreen(String expectedText) {
        return driver.getPageSource().contains(expectedText);
    }
}
