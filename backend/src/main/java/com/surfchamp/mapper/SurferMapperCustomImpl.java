package com.surfchamp.mapper;

import com.surfchamp.dto.SurferDTO;
import com.surfchamp.model.EmergencyContact;
import com.surfchamp.model.Surfer;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@Primary
public class SurferMapperCustomImpl implements SurferMapper {

    private final SurferMapper delegate;

    public SurferMapperCustomImpl() {
        // Usa o MapStruct para obter a implementação gerada
        this.delegate = Mappers.getMapper(SurferMapper.class);
    }

    @Override
    public SurferDTO toDTO(Surfer surfer) {
        if (surfer == null) {
            return null;
        }
        return delegate.toDTO(surfer);
    }

    @Override
    public Surfer toEntity(SurferDTO surferDTO) {
        if (surferDTO == null) {
            return null;
        }
        
        // Primeiro, converte o DTO para a entidade usando o mapeamento padrão
        Surfer surfer = delegate.toEntity(surferDTO);
        
        // Mapear o contato de emergência manualmente apenas se existir no DTO
        if (surferDTO.getEmergencyContact() != null) {
            EmergencyContact emergencyContact = new EmergencyContact();
            
            // Mapeia apenas os campos que não são nulos
            if (surferDTO.getEmergencyContact().getName() != null) {
                emergencyContact.setName(surferDTO.getEmergencyContact().getName().trim());
            }
            
            if (surferDTO.getEmergencyContact().getPhoneNumber() != null) {
                String phoneNumber = surferDTO.getEmergencyContact().getPhoneNumber().replaceAll("\\D", "");
                if (!phoneNumber.isEmpty()) {
                    emergencyContact.setPhoneNumber(phoneNumber);
                }
            }
            
            if (surferDTO.getEmergencyContact().getRelationship() != null) {
                emergencyContact.setRelationship(surferDTO.getEmergencyContact().getRelationship().trim());
            }
            
            // Só define o contato de emergência se pelo menos um campo estiver preenchido
            if ((emergencyContact.getName() != null && !emergencyContact.getName().trim().isEmpty()) ||
                (emergencyContact.getPhoneNumber() != null && !emergencyContact.getPhoneNumber().trim().isEmpty()) ||
                (emergencyContact.getRelationship() != null && !emergencyContact.getRelationship().trim().isEmpty())) {
                surfer.setEmergencyContact(emergencyContact);
            }
        }
        
        return surfer;
    }

    @Override
    public List<SurferDTO> toDTOList(List<Surfer> surfers) {
        if (surfers == null) {
            return null;
        }
        return surfers.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<Surfer> toEntityList(List<SurferDTO> surferDTOs) {
        if (surferDTOs == null) {
            return null;
        }
        return surferDTOs.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void updateFromDTO(SurferDTO dto, Surfer entity) {
        if (dto == null || entity == null) {
            return;
        }
        
        // Atualiza os campos básicos
        if (dto.getName() != null) {
            entity.setName(dto.getName().trim());
        }
        if (dto.getStance() != null) {
            entity.setStance(dto.getStance());
        }
        if (dto.getBirthDate() != null) {
            entity.setBirthDate(dto.getBirthDate());
        }
        if (dto.getHeight() != null) {
            entity.setHeight(dto.getHeight());
        }
        if (dto.getWeight() != null) {
            entity.setWeight(dto.getWeight());
        }
        if (dto.getLevel() != null) {
            entity.setLevel(dto.getLevel());
        }
        if (dto.getPhoneNumber() != null) {
            String phoneNumber = dto.getPhoneNumber().replaceAll("\\D", "");
            if (!phoneNumber.isEmpty()) {
                entity.setPhoneNumber(phoneNumber);
            }
        }
        if (dto.getCpf() != null) {
            entity.setCpf(dto.getCpf().replaceAll("\\D", ""));
        }
        
        // Atualiza o contato de emergência
        if (dto.getEmergencyContact() != null) {
            SurferDTO.EmergencyContactDTO dtoContact = dto.getEmergencyContact();
            
            // Se o DTO tiver um contato de emergência, mas a entidade não tiver, cria um novo
            if (entity.getEmergencyContact() == null) {
                entity.setEmergencyContact(new EmergencyContact());
            }
            
            EmergencyContact emergencyContact = entity.getEmergencyContact();
            boolean hasChanges = false;
            
            // Atualiza apenas os campos que foram fornecidos no DTO
            if (dtoContact.getName() != null && !dtoContact.getName().trim().isEmpty()) {
                emergencyContact.setName(dtoContact.getName().trim());
                hasChanges = true;
            }
            
            if (dtoContact.getPhoneNumber() != null) {
                String phoneNumber = dtoContact.getPhoneNumber().replaceAll("\\D", "");
                if (!phoneNumber.isEmpty()) {
                    emergencyContact.setPhoneNumber(phoneNumber);
                    hasChanges = true;
                }
            }
            
            if (dtoContact.getRelationship() != null && !dtoContact.getRelationship().trim().isEmpty()) {
                emergencyContact.setRelationship(dtoContact.getRelationship().trim());
                hasChanges = true;
            }
            
            // Se não houver alterações válidas, remove o contato de emergência
            if (!hasChanges) {
                entity.setEmergencyContact(null);
            }
        } else {
            // Se o DTO não tiver um contato de emergência, remove da entidade
            entity.setEmergencyContact(null);
        }
    }
}
