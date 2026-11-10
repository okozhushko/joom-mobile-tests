package mobile.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Properties;

public final class Config {
    private static final String FILE = "config.properties";
    private static final Properties PROPERTIES = load();

    private Config() {
    }

    public static String get(String key) {
        String value = PROPERTIES.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing property '" + key + "' in " + FILE);
        }
        return value.trim();
    }

    public static int getInt(String key) {
        return Integer.parseInt(get(key));
    }

    public static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Environment variable " + name + " is not set");
        }
        return value;
    }

    private static Properties load() {
        try (InputStream input = Config.class.getClassLoader().getResourceAsStream(FILE)) {
            if (input == null) {
                throw new IllegalStateException(FILE + " not found on the classpath");
            }
            Properties properties = new Properties();
            properties.load(input);
            return properties;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read " + FILE, e);
        }
    }
}
