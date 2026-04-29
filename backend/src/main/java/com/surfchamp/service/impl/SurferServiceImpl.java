package com.surfchamp.service.impl;

import com.surfchamp.dto.SurferDTO;
import com.surfchamp.exception.ResourceAlreadyExistsException;
import com.surfchamp.exception.ResourceNotFoundException;
import com.surfchamp.mapper.SurferMapper;
import com.surfchamp.model.Surfer;
import com.surfchamp.model.User;
import com.surfchamp.repository.SurferRepository;
import com.surfchamp.repository.UserRepository;
import com.surfchamp.service.SurferService;
import com.surfchamp.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurferServiceImpl implements SurferService {

    private final SurferRepository surferRepository;
    private final SurferMapper surferMapper;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public SurferServiceImpl(
            SurferRepository surferRepository, 
            SurferMapper surferMapper,
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder
    ) {
        this.surferRepository = surferRepository;
        this.surferMapper = surferMapper;
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<SurferDTO> findAll() {
        return surferRepository.findAll().stream()
                .map(surferMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<SurferDTO> findAll(Pageable pageable) {
        return surferRepository.findAll(pageable)
                .map(surferMapper::toDTO);
    }

    @Override
    public SurferDTO findById(Long id) {
        return surferRepository.findById(id)
                .map(surferMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Surfer not found with id: " + id));
    }

    @Override
    public SurferDTO create(SurferDTO surferDTO) {
        // Check if user with this email already exists
        if (userRepository.existsByUsername(surferDTO.getEmail())) {
            throw new ResourceAlreadyExistsException("User with email " + surferDTO.getEmail() + " already exists");
        }

        // Create and save user first
        User user = new User();
        user.setUsername(surferDTO.getEmail());
        user.setPassword(passwordEncoder.encode(surferDTO.getPassword()));
        user.setRole("SURFER");
        user = userRepository.save(user);

        // Create and save surfer
        Surfer surfer = surferMapper.toEntity(surferDTO);
        surfer.setUser(user);
        Surfer savedSurfer = surferRepository.save(surfer);
        
        return surferMapper.toDTO(savedSurfer);
    }

    @Override
    @Transactional
    public SurferDTO update(Long id, SurferDTO surferDTO) {
        return surferRepository.findById(id)
                .map(existingSurfer -> {
                    // Verifica se o email foi alterado e se já existe outro surfista com o novo email
                    if (!existingSurfer.getEmail().equals(surferDTO.getEmail()) && 
                        surferRepository.existsByEmailAndIdNot(surferDTO.getEmail(), id)) {
                        throw new IllegalArgumentException("Já existe um surfista cadastrado com este email.");
                    }
                    
                    // Verifica se o CPF foi alterado e se já existe outro surfista com o novo CPF
                    if (!existingSurfer.getCpf().equals(surferDTO.getCpf()) && 
                        surferRepository.existsByCpfAndIdNot(surferDTO.getCpf(), id)) {
                        throw new IllegalArgumentException("Já existe um surfista cadastrado com este CPF.");
                    }
                    
                    // Atualiza o email do usuário se necessário
                    if (!existingSurfer.getEmail().equals(surferDTO.getEmail())) {
                        User user = existingSurfer.getUser();
                        user.setUsername(surferDTO.getEmail());
                        userService.updateUser(user);
                    }
                    
                    // Atualiza os campos do surfista existente usando o mapper
                    surferMapper.updateFromDTO(surferDTO, existingSurfer);
                    
                    // Garante que o status ativo seja mantido se não for fornecido
                    if (surferDTO.getActive() == null) {
                        existingSurfer.setActive(true);
                    }
                    
                    Surfer updatedSurfer = surferRepository.save(existingSurfer);
                    return surferMapper.toDTO(updatedSurfer);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Surfer not found with id: " + id));
    }

    @Override
    public void delete(Long id) {
        Surfer surfer = surferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surfer not found with id: " + id));
        
        // Get the user before deleting the surfer
        User user = surfer.getUser();
        
        // Delete the surfer first to maintain referential integrity
        surferRepository.delete(surfer);
        
        // Then delete the associated user if it exists
        if (user != null) {
            userRepository.delete(user);
        }
    }

    @Override
    public List<SurferDTO> search(String query) {
        return surferRepository.findByNameContainingIgnoreCase(query)
                .stream()
                .map(surferMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SurferDTO> findByLevel(String level) {
        return List.of();
    }
}
