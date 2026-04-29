package com.surfchamp.mapper;

import com.surfchamp.dto.SurferDTO;
import com.surfchamp.model.Surfer;
import com.surfchamp.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SurferMapper {
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "email", source = "user.username")
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "stance", source = "stance")
    @Mapping(target = "birthDate", source = "birthDate", dateFormat = "dd/MM/yyyy")
    @Mapping(target = "height", source = "height")
    @Mapping(target = "weight", source = "weight")
    @Mapping(target = "level", source = "level")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "cpf", source = "cpf")
    @Mapping(target = "address", source = "address")
    @Mapping(target = "emergencyContact", source = "emergencyContact")
    @Mapping(target = "sponsors", source = "sponsors")
    @Mapping(target = "isActive", source = "active")
    SurferDTO toDTO(Surfer surfer);
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "stance", source = "stance")
    @Mapping(target = "birthDate", source = "birthDate", dateFormat = "dd/MM/yyyy")
    @Mapping(target = "height", source = "height")
    @Mapping(target = "weight", source = "weight")
    @Mapping(target = "level", source = "level")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "cpf", source = "cpf")
    @Mapping(target = "address", source = "address")
    @Mapping(target = "emergencyContact", source = "emergencyContact")
    @Mapping(target = "sponsors", source = "sponsors")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "user", source = ".", qualifiedByName = "toUser")
    Surfer toEntity(SurferDTO surferDTO);
    
    @Named("toUser")
    default User toUser(SurferDTO dto) {
        if (dto == null) {
            return null;
        }
        return User.builder()
                .id(dto.getId())
                .username(dto.getEmail())
                .password(dto.getPassword())
                .role("SURFER")
                .build();
    }
    
    List<SurferDTO> toDTOList(List<Surfer> surfers);
    
    List<Surfer> toEntityList(List<SurferDTO> surferDTOs);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "user", source = ".", qualifiedByName = "toUser")
    void updateFromDTO(SurferDTO dto, @MappingTarget Surfer entity);
}
