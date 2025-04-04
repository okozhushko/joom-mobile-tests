package tests.account;

import mobile.dto.AddUserData;
import mobile.enums.AccountTitle;
import mobile.generator.FakeRandomGenerator;
import mobile.helper.TestDescription;
import mobile.screens.JoomHomeScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.BaseTest;
import static mobile.utils.Constants.USER_EMAIL;
import static mobile.utils.Constants.USER_FIRST_NAME;
import static mobile.utils.Constants.USER_LAST_NAME;
import static mobile.utils.Constants.USER_PASSWORD;
import static mobile.utils.Constants.USER_PASSWORD_CONFIRMATION;

public class RegistrationUserTest extends BaseTest {

    private final AccountTitle newUserData = FakeRandomGenerator.getRandomOption(AccountTitle.class);

    private final AddUserData addUserData = AddUserData.builder()
            .userFirstName(USER_FIRST_NAME)
            .userLastName(USER_LAST_NAME)
            .userEmail(USER_EMAIL)
            .userPassword(USER_PASSWORD)
            .userPasswordConfirmation(USER_PASSWORD_CONFIRMATION)
            .build();

    @Test
    @Tag("acceptanceTest")
    @DisplayName("Open Login screen")
    @TestDescription("Close advertisement, enable notifications, confirmation")

    public void testRegistrationUser(){
        JoomHomeScreen joomHomeScreen = new JoomHomeScreen(driver);
        joomHomeScreen
                .closeAdvertisement()
                .clickEnableButton()
                .clickAllowButton()
                .clickSpinTheWheel()
                .backHomeButton()
                .clickProfileButton()
                .openRegistrationForm()
                .signUpWithEmail()
                .registrationNewUser(addUserData)
                .verifyUserRegistered(newUserData);

    }
}
