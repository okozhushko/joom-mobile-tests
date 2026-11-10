package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import io.appium.java_client.support.PageFactory;
import mobile.utils.WaitUtils;

public abstract class BaseScreen {

    protected final AppiumDriver driver;
    protected final WaitUtils waitUtils;

    protected BaseScreen(AppiumDriver driver) {
        this.driver = driver;
        this.waitUtils = new WaitUtils(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
    }
}
