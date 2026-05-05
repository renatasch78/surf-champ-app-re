import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
  Divider,
  IconButton,
  FormControlLabel,
  Switch,
  FormGroup,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  CircularProgress,
  OutlinedInput
} from '@mui/material';
import { Visibility, VisibilityOff, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Define Surfer type if needed
const Surfer = {
  id: null,
  name: '',
  email: '',
  phoneNumber: '',
  birthDate: null,
  // Add other Surfer properties as needed
  address: {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  },
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  }
};
// Text mask component for phone number
const PhoneMaskCustom = forwardRef((props, ref) => {
  const { inputRef, ...other } = props;
  return (
    <TextField
      {...other}
      inputRef={inputRef}
      variant="outlined"
      fullWidth
    />
  );
});

PhoneMaskCustom.propTypes = {
  inputRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
};

const stances = [
  { value: 'REGULAR', label: 'Regular (pé esquerdo à frente)' },
  { value: 'GOOFY', label: 'Goofy (pé direito à frente)' }
];

const levels = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermediário' },
  { value: 'ADVANCED', label: 'Avançado' },
  { value: 'PROFESSIONAL', label: 'Profissional' }
];

const relationships = [
  'Pai/Mãe', 'Irmã/Irmão', 'Amiga/Amigo', 'Conjuge', 'Outro'
];

const schema = yup.object().shape({
  // Apenas nome e email são obrigatórios
  name: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  
  // Senha é opcional, se não for informada, será usado o email como senha
  password: yup
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .nullable()
    .transform(value => value === '' ? null : value),
    
  // Confirmação de senha só é validada se a senha for informada
  confirmPassword: yup
    .string()
    .nullable()
    .transform(value => value === '' ? null : value)
    .when('password', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema
        .required('Confirme a senha')
        .oneOf([yup.ref('password')], 'As senhas não conferem')
    }),
  // Demais campos são opcionais
  birthDate: yup.date().nullable(),
  stance: yup.string(),
  phoneNumber: yup.string()
    .test('phone', 'Telefone inválido (10 ou 11 dígitos)', (value) => {
      if (!value) return true; // Permite valor nulo/vazio
      const digitsOnly = value.replace(/\D/g, '');
      return digitsOnly.length === 10 || digitsOnly.length === 11;
    })
    .nullable(),
  weight: yup.number().typeError('Peso deve ser um número').positive('Peso deve ser positivo').nullable(),
  height: yup.number().typeError('Altura deve ser um número').positive('Altura deve ser positiva').nullable(),
  level: yup.string(),
  cpf: yup.string(),
  address: yup.object().shape({
    street: yup.string(),
    number: yup.string(),
    neighborhood: yup.string(),
    city: yup.string(),
    state: yup.string(),
    zipCode: yup.string()
  }),
  emergencyContact: yup.object().shape({
    name: yup.string(),
    phoneNumber: yup.string(),
    relationship: yup.string()
  })
});

// Helper function to parse date string in dd/MM/yyyy format
const parseDateString = (dateString) => {
  if (!dateString) return null;
  
  // Check if the date string is already in ISO format (from backend)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(dateString);
  }
  
  // Handle dd/MM/yyyy format
  const [day, month, year] = dateString.split('/').map(Number);
  // Note: month is 0-indexed in JavaScript Date (0 = January, 11 = December)
  return new Date(year, month - 1, day);
};

const SurferForm = ({ surfer, onSave, onCancel, loading, error }) => {
  const isNew = !surfer?.id;
  const [showPassword, setShowPassword] = useState(false);
  const [sponsorInput, setSponsorInput] = useState('');
  const [sponsors, setSponsors] = useState(surfer?.sponsors || []);
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      id: surfer?.id || null,
      name: surfer?.name || '',
      email: surfer?.email || '',
      password: '',
      confirmPassword: '',
      phoneNumber: surfer?.phoneNumber || '',
      cpf: surfer?.cpf || '',
      birthDate: surfer?.birthDate ? (typeof surfer.birthDate === 'string' ? parseDateString(surfer.birthDate) : surfer.birthDate) : null,
      stance: surfer?.stance || '',
      weight: surfer?.weight || '',
      height: surfer?.height || '',
      hometown: surfer?.hometown || '',
      country: surfer?.country || '',
      level: surfer?.level || '',
      sponsors: surfer?.sponsors || [],
      emergencyContact: {
        name: surfer?.emergencyContact?.name || '',
        phoneNumber: surfer?.emergencyContact?.phoneNumber || '',
        relationship: surfer?.emergencyContact?.relationship || ''
      },
      address: surfer?.address || {}
    }
  });

  const watchedValues = watch();

  const handleAddSponsor = () => {
    if (sponsorInput.trim() && !sponsors.includes(sponsorInput)) {
      const newSponsors = [...sponsors, sponsorInput.trim()];
      setSponsors(newSponsors);
      setValue('sponsors', newSponsors);
      setSponsorInput('');
    }
  };

  const handleRemoveSponsor = (sponsorToRemove) => {
    const newSponsors = sponsors.filter(s => s !== sponsorToRemove);
    setSponsors(newSponsors);
    setValue('sponsors', newSponsors);
  };

  const onSubmit = async (data, event) => {
    if (event) event.preventDefault();
    
    console.log('[DEBUG] Iniciando submissão do formulário');
    console.log('[DEBUG] Dados do formulário antes do processamento:', JSON.parse(JSON.stringify(data)));
    
    try {
      console.log('[DEBUG] Validando campos obrigatórios');
      
      // Criar um objeto com os dados para validação
      const validationData = {
        name: data.name,
        email: data.email,
        password: data.password || null,
        confirmPassword: data.confirmPassword || null
      };
      
      console.log('[DEBUG] Dados para validação:', validationData);
      
      // Validar todos os campos de uma vez
      await schema.validate(validationData, { abortEarly: false });
      console.log('[DEBUG] Validação concluída com sucesso');
      
      console.log(data.password 
        ? '[DEBUG] Senha fornecida, usando senha informada'
        : '[DEBUG] Nenhuma senha fornecida, usando email como senha'
      );
      
      // Função para remover campos vazios de um objeto
      const removeEmptyFields = (obj) => {
        if (!obj || typeof obj !== 'object') return {};
        const newObj = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
            newObj[key] = obj[key];
          }
        });
        return newObj;
      };
      
      // Formatar os dados para o formato esperado pelo backend
      const formData = {
        ...removeEmptyFields({
          ...data,
          // Garantir que phoneNumber está no formato correto (apenas números e com o tamanho correto)
          ...(data.phoneNumber && {
            phoneNumber: data.phoneNumber.replace(/\D/g, '')
          }),
          // Formatar telefone de emergência se existir
          ...(data.emergencyContact && data.emergencyContact.phoneNumber && {
            emergencyContact: {
              ...data.emergencyContact,
              phoneNumber: data.emergencyContact.phoneNumber.replace(/\D/g, '')
            }
          }),
          // Garantir que o CPF tenha apenas números
          ...(data.cpf && {
            cpf: data.cpf.replace(/\D/g, '')
          }),
          // Formatar data para o padrão dd/MM/yyyy
          birthDate: data.birthDate ? format(data.birthDate, 'dd/MM/yyyy') : null,
          // Converter para os tipos corretos
          weight: data.weight ? parseFloat(data.weight) : null,
          height: data.height ? parseInt(data.height) : null,
          // Remover campos vazios de objetos aninhados
          address: data.address ? removeEmptyFields(data.address) : undefined,
          emergencyContact: data.emergencyContact ? removeEmptyFields(data.emergencyContact) : undefined,
          // Incluir patrocinadores se houver
          sponsors: sponsors.length > 0 ? sponsors : undefined,
          // Usar senha fornecida ou email como senha
          password: data.password || data.email
        }),
        // Remover campo de confirmação de senha
        confirmPassword: undefined
      };
      
      console.log('[DEBUG] Dados formatados para envio:', JSON.stringify(formData, null, 2));
      console.log('[DEBUG] Tipos dos dados:');
      Object.entries(formData).forEach(([key, value]) => {
        console.log(`- ${key}:`, typeof value, '=', value);
        if (value && typeof value === 'object') {
          console.log('  Detalhes:');
          Object.entries(value).forEach(([subKey, subValue]) => {
            console.log(`  - ${subKey}:`, typeof subValue, '=', subValue);
          });
        }
      });
      console.log('[DEBUG] Chamando onSave...');
      
      try {
        const result = onSave(formData);
        console.log('[DEBUG] onSave chamado, resultado:', result);
        
        if (result && typeof result.then === 'function') {
          console.log('[DEBUG] onSave retornou uma Promise, aguardando...');
          await result;
          console.log('[DEBUG] Promise resolvida, fechando formulário');
          if (onCancel) onCancel();
        } else if (onCancel) {
          console.log('[DEBUG] onSave não retornou uma Promise, fechando formulário');
          onCancel();
        }
      } catch (error) {
        console.error('[DEBUG] Erro ao chamar onSave:', error);
        // Se for um erro de resposta da API, mostrar a mensagem de erro
        if (error.response && error.response.data) {
          console.error('[DEBUG] Detalhes do erro:', error.response.data);
          throw new Error(error.response.data.message || 'Erro ao salvar o surfista');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao processar o formulário:', error);
      
      if (error.name === 'ValidationError') {
        // Tratar erros de validação do Yup
        const validationErrors = {};
        error.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        console.error('Erros de validação detalhados:', validationErrors);
        
        // Exibir erros no console para cada campo com problema
        Object.entries(validationErrors).forEach(([field, message]) => {
          console.error(`Campo com erro: ${field} - ${message}`);
        });
        
        // Exibir um alerta com os erros para facilitar a depuração
        alert(`Erro de validação:\n${Object.entries(validationErrors).map(([field, message]) => 
          `- ${field}: ${message}`
        ).join('\n')}`);
        
      } else {
        // Outros tipos de erro
        console.error('Erro inesperado:', error);
        alert(`Ocorreu um erro inesperado: ${error.message || 'Verifique o console para mais detalhes'}`);
      }
    }
  };

  // Log para verificar se o componente está renderizando
  console.log('[DEBUG] Renderizando formulário');
  
  // Criar uma versão do handleSubmit com log
  const handleFormSubmit = (e) => {
    console.log('[DEBUG] Formulário submetido');
    e.preventDefault();
    // Usar o handleSubmit para garantir que a validação seja executada
    handleSubmit(onSubmit)();
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <form onSubmit={handleFormSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados Pessoais
          </Typography>
          <Grid container spacing={2}>
            {/* Primeira linha - Nome e CPF */}
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome Completo"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="cpf"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CPF"
                    value={value || ''}
                    onChange={(e) => {
                      // CPF mask: 000.000.000-00
                      const value = e.target.value.replace(/\D/g, '');
                      let maskedValue = value;
                      
                      if (value.length > 9) {
                        maskedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
                      } else if (value.length > 6) {
                        maskedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
                      } else if (value.length > 3) {
                        maskedValue = `${value.substring(0, 3)}.${value.substring(3)}`;
                      }
                      onChange(maskedValue);
                    }}
                    error={!!errors.cpf}
                    helperText={errors.cpf?.message}
                    margin="normal"
                    inputProps={{
                      maxLength: 14,
                      placeholder: '000.000.000-00'
                    }}
                  />
                )}
              />
            </Grid>

            {/* Segunda linha - Data de Nascimento e Telefone */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Data de Nascimento"
                      format="dd/MM/yyyy"
                      value={field.value ? (typeof field.value === 'string' ? parseDateString(field.value) : field.value) : null}
                      onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.birthDate,
                          helperText: errors.birthDate?.message,
                          variant: 'outlined',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '56px',
                              '& input': {
                                padding: '16.5px 14px',
                              },
                            },
                            '& .MuiInputLabel-outlined': {
                              transform: 'translate(14px, 16px) scale(1)',
                              '&.MuiInputLabel-shrink': {
                                transform: 'translate(14px, -6px) scale(0.75)',
                              },
                            },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefone"
                    value={value || ''}
                    onChange={(e) => {
                      // Phone mask: (00) 00000-0000
                      let maskedValue = e.target.value.replace(/\D/g, '');
                      if (maskedValue.length > 0) {
                        maskedValue = `(${maskedValue}`;
                        if (maskedValue.length > 3) {
                          maskedValue = `${maskedValue.substring(0, 3)}) ${maskedValue.substring(3)}`;
                        }
                        if (maskedValue.length > 10) {
                          maskedValue = `${maskedValue.substring(0, 10)}-${maskedValue.substring(10, 15)}`;
                        }
                      }
                      onChange(maskedValue);
                    }}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    margin="normal"
                    inputProps={{
                      maxLength: 15,
                      placeholder: '(00) 00000-0000'
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Seção de Informações de Login */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informações de Login
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="E-mail (será seu usuário)"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Espaço vazio para alinhamento */}
            </Grid>
            
            {isNew && (
              <>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Senha (opcional)"
                        type={showPassword ? 'text' : 'password'}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        margin="normal"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Confirmar Senha"
                        type={showPassword ? 'text' : 'password'}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                        margin="normal"
                        autoComplete="new-password"
                        disabled={!watch('password')} // Desativa se não houver senha digitada
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                disabled={!watch('password')}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informações de Surf
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="stance"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" sx={{ minWidth: 300 }}>
                    <InputLabel>Base</InputLabel>
                    <Select
                      {...field}
                      label="Base"
                      error={!!errors.stance}
                      sx={{
                        '& .MuiSelect-select': {
                          minWidth: '300px',
                          width: '100%'
                        }
                      }}
                    >
                      {stances.map((stance) => (
                        <MenuItem key={stance.value} value={stance.value}>
                          {stance.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" sx={{ minWidth: 300 }}>
                    <InputLabel>Nível</InputLabel>
                    <Select
                      {...field}
                      label="Nível"
                      error={!!errors.level}
                      sx={{
                        '& .MuiSelect-select': {
                          minWidth: '300px',
                          width: '100%'
                        }
                      }}
                    >
                      {levels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Peso (kg)"
                    type="number"
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Altura (m)"
                    type="number"
                    step="0.01"
                    error={!!errors.height}
                    helperText={errors.height?.message}
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Patrocinadores
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <TextField
                  value={sponsorInput}
                  onChange={(e) => setSponsorInput(e.target.value)}
                  label="Adicionar patrocinador"
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSponsor())}
                />
                <Button
                  onClick={handleAddSponsor}
                  startIcon={<AddIcon />}
                  sx={{ ml: 1 }}
                  variant="outlined"
                >
                  Adicionar
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {sponsors.map((sponsor) => (
                  <Chip
                    key={sponsor}
                    label={sponsor}
                    onDelete={() => handleRemoveSponsor(sponsor)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Endereço
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={9}>
              <Controller
                name="address.street"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Rua"
                    error={!!errors.address?.street}
                    helperText={errors.address?.street?.message}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        width: '100%',
                        maxWidth: '100%',
                      },
                      '& .MuiInputBase-input': {
                        width: '100%',
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="address.number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número"
                    error={!!errors.address?.number}
                    helperText={errors.address?.number?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="address.complement"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Complemento"
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="address.neighborhood"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Bairro"
                    error={!!errors.address?.neighborhood}
                    helperText={errors.address?.neighborhood?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cidade"
                    error={!!errors.address?.city}
                    helperText={errors.address?.city?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="address.state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Estado"
                    error={!!errors.address?.state}
                    helperText={errors.address?.state?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Controller
                name="address.zipCode"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CEP"
                    value={value || ''}
                    onChange={(e) => {
                      // CEP mask: 00000-000
                      let maskedValue = e.target.value.replace(/\D/g, '');
                      if (maskedValue.length > 5) {
                        maskedValue = `${maskedValue.substring(0, 5)}-${maskedValue.substring(5, 8)}`;
                      }
                      if (maskedValue.length > 9) {
                        maskedValue = maskedValue.substring(0, 9);
                      }
                      onChange(maskedValue);
                    }}
                    error={!!errors.address?.zipCode}
                    helperText={errors.address?.zipCode?.message}
                    margin="normal"
                    inputProps={{
                      maxLength: 9,
                      placeholder: '00000-000'
                    }}
                    onBlur={async (e) => {
                      const cep = e.target.value.replace(/\D/g, '');
                      if (cep.length === 8) {
                        try {
                          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                          const data = await response.json();
                          if (!data.erro) {
                            setValue('address.street', data.logradouro, { shouldValidate: true });
                            setValue('address.neighborhood', data.bairro, { shouldValidate: true });
                            setValue('address.city', data.localidade, { shouldValidate: true });
                            setValue('address.state', data.uf, { shouldValidate: true });
                          }
                        } catch (error) {
                          console.error('Erro ao buscar CEP:', error);
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contato de Emergência
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="emergencyContact.name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome do Contato"
                    error={!!errors.emergencyContact?.name}
                    helperText={errors.emergencyContact?.name?.message}
                    margin="normal"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Controller
                name="emergencyContact.phoneNumber"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefone de Emergência"
                    value={value || ''}
                    onChange={(e) => {
                      // Phone mask: (00) 00000-0000
                      let maskedValue = e.target.value.replace(/\D/g, '');
                      if (maskedValue.length > 0) {
                        maskedValue = `(${maskedValue}`;
                        if (maskedValue.length > 3) {
                          maskedValue = `${maskedValue.substring(0, 3)}) ${maskedValue.substring(3)}`;
                        }
                        if (maskedValue.length > 10) {
                          maskedValue = `${maskedValue.substring(0, 10)}-${maskedValue.substring(10, 15)}`;
                        }
                      }
                      onChange(maskedValue);
                    }}
                    error={!!errors.emergencyContact?.phoneNumber}
                    helperText={errors.emergencyContact?.phoneNumber?.message}
                    margin="normal"
                    inputProps={{
                      maxLength: 15,
                      placeholder: '(00) 00000-0000'
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="emergencyContact.relationship"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" sx={{ minWidth: 200 }}>
                    <InputLabel>Parentesco</InputLabel>
                    <Select
                      {...field}
                      label="Parentesco"
                      error={!!errors.emergencyContact?.relationship}
                      sx={{
                        '& .MuiSelect-select': {
                          minWidth: '200px',
                          width: '100%'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            minWidth: '250px'
                          }
                        }
                      }}
                    >
                      {relationships.map((rel) => (
                        <MenuItem key={rel} value={rel}>
                          {rel}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            onClick={() => {
              console.log('Botão Cancelar clicado');
              onCancel();
            }}
            variant="outlined"
            color="inherit"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            onClick={(e) => {
              console.log('Botão Salvar clicado');
              e.preventDefault();
              handleSubmit(onSubmit)();
            }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </form>
    </LocalizationProvider>
  );
};
export default SurferForm;
