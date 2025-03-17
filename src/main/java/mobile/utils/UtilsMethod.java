package mobile.utils;

import java.io.InputStream;
import java.util.Properties;
import java.text.SimpleDateFormat;
import java.util.Date;

public class UtilsMethod {
    private static final Properties properties = new Properties();

    static {
        try (InputStream input =
                     UtilsMethod.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                throw new IllegalStateException("File 'config.properties' not found");
            }
            properties.load(input);
        } catch (Exception e) {
            throw new RuntimeException("Couldn't load 'config.properties' file", e);
        }
    }

    public static String getValue(String key) {
        if (key.equals("USER_EMAIL")) {
            return generateDynamicEmail();
        }
        return properties.getProperty(key);
    }

    private static String generateDynamicEmail() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMddHHmmss");
        String timestamp = dateFormat.format(new Date());
        return "email" + timestamp + "@test.com";
    }
}
