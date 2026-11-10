# joom-mobile-tests

Appium UI tests for the Joom Android app (Java 23, JUnit 5, Gradle).

## Prerequisites

- JDK 23 installed (Gradle finds it through the toolchain; the Gradle daemon itself can run on JDK 17+).
- For local runs: an Appium server with the UiAutomator2 driver at `http://127.0.0.1:4723/`, and an Android
  emulator with the Joom app (`com.joom`) installed.
- For BrowserStack runs: the app uploaded to BrowserStack, with its `bs://` id set as `browserstack.app` in
  `src/main/resources/config.properties`.

## Running

```sh
# Local emulator (default)
./gradlew test

# BrowserStack
export BROWSERSTACK_USERNAME=...
export BROWSERSTACK_ACCESS_KEY=...
APPIUM_TARGET=browserstack ./gradlew test
```

Every test gets a new Appium session, so the app starts from a clean state.
When the `CI` environment variable is set, only tests tagged `acceptanceTest` run.

## Configuration

Non-secret settings (app package, device names, timeouts, server URLs) live in
`src/main/resources/config.properties`. Credentials are read only from the environment variables above, never from
files.

## Known limitations

- The launch ad is closed by tapping fixed screen coordinates after a fixed 4-second delay (`JoomHomeScreen`). It
  only works on the screen size the test was written for, until the close button gets a real locator.
- Some locators are positional or generic (`JoomHomePageLocators`, `LoginPageLocators`), so a layout change in the
  app breaks them.

## CI

`.gitlab-ci.yml` compiles on merge requests and the default branch. It then runs the tests on BrowserStack:
automatically on the default branch, and as a manual job on merge requests. Define `BROWSERSTACK_USERNAME` and
`BROWSERSTACK_ACCESS_KEY` as masked CI/CD variables. Each test run publishes JUnit results to the pipeline and keeps
the HTML report as a job artifact for 14 days.
