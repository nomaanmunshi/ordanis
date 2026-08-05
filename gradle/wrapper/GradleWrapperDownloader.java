import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.HexFormat;

public class GradleWrapperDownloader {
    private static final URI SOURCE = URI.create(
            "https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar");
    private static final String SHA256 =
            "7d3a4ac4de1c32b59bc6a4eb8ecb8e612ccd0cf1ae1e99f66902da64df296172";

    public static void main(String[] args) throws Exception {
        var target = Path.of(args[0]);
        var response = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build()
                .send(HttpRequest.newBuilder(SOURCE).build(), HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("wrapper download failed: HTTP " + response.statusCode());
        }

        var bytes = response.body();
        var actual = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        if (!SHA256.equals(actual)) throw new SecurityException("Gradle wrapper checksum mismatch");

        Files.createDirectories(target.getParent());
        var temporary = target.resolveSibling(target.getFileName() + ".tmp");
        Files.write(temporary, bytes);
        Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }
}
