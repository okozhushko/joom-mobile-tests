package tests.account;

import static org.assertj.core.api.Assertions.assertThat;

import mobile.enums.LoginTitle;
import mobile.screens.JoomHomeScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.BaseTest;

class GetProfileScreenTest extends BaseTest {

    @Test
    @Tag("acceptanceTest")
    @DisplayName("Guest sees the 'Log in' prompt on the profile screen")
    void guestProfileShowsLogIn() {
        String expected = LoginTitle.LOGIN_TITLE.getValue();

        String header = new JoomHomeScreen(driver)
                .completeOnboarding()
                .openProfile()
                .waitForHeaderText(expected);

        assertThat(header).as("Profile header for a guest").isEqualTo(expected);
    }
}
