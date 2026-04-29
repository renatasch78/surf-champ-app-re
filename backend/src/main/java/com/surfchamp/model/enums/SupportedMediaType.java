package com.surfchamp.model.enums;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum SupportedMediaType {
    // Formatos de vídeo suportados
    MP4("video/mp4", "mp4", "MPEG-4", "mp4", "m4v", "mp4v"),
    AVI("video/avi", "avi", "AVI", "avi"),
    MOV("video/quicktime", "mov", "QuickTime", "mov", "qt"),
    WMV("video/x-ms-wmv", "wmv", "Windows Media Video", "wmv"),
    FLV("video/x-flv", "flv", "Flash Video", "flv"),
    MKV("video/x-matroska", "mkv", "Matroska", "mkv"),
    WEBM("video/webm", "webm", "WebM", "webm");

    private final String mimeType;
    private final String primaryExtension;
    private final String displayName;
    private final List<String> fileExtensions;

    SupportedMediaType(String mimeType, String primaryExtension, String displayName, String... additionalExtensions) {
        this.mimeType = mimeType;
        this.primaryExtension = primaryExtension;
        this.displayName = displayName;
        this.fileExtensions = Stream.concat(
            Stream.of(primaryExtension),
            Arrays.stream(additionalExtensions)
        ).map(String::toLowerCase).collect(Collectors.toList());
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getPrimaryExtension() {
        return primaryExtension;
    }

    public String getDisplayName() {
        return displayName;
    }

    public List<String> getFileExtensions() {
        return fileExtensions;
    }

    public static SupportedMediaType fromMimeType(String mimeType) {
        if (mimeType == null) return null;
        
        String normalizedMimeType = mimeType.toLowerCase();
        return Arrays.stream(values())
            .filter(type -> type.getMimeType().equalsIgnoreCase(normalizedMimeType))
            .findFirst()
            .orElse(null);
    }

    public static SupportedMediaType fromExtension(String extension) {
        if (extension == null) return null;
        
        String normalizedExt = extension.toLowerCase();
        return Arrays.stream(values())
            .filter(type -> type.getFileExtensions().contains(normalizedExt))
            .findFirst()
            .orElse(null);
    }

    public static List<String> getAllSupportedMimeTypes() {
        return Arrays.stream(values())
            .map(SupportedMediaType::getMimeType)
            .collect(Collectors.toList());
    }

    public static List<String> getAllSupportedExtensions() {
        return Arrays.stream(values())
            .flatMap(type -> type.getFileExtensions().stream())
            .distinct()
            .collect(Collectors.toList());
    }

    public static boolean isSupportedMimeType(String mimeType) {
        return fromMimeType(mimeType) != null;
    }

    public static boolean isSupportedExtension(String extension) {
        return fromExtension(extension) != null;
    }
}
