const Surfer = {
  id: null,
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  stance: 'regular', // regular ou goofy
  weight: '',
  height: '',
  level: 'iniciante', // iniciante, intermediario, avancado, profissional
  phone: '',
  cpf: '',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  },
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },
  sponsors: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true
};

export default Surfer;
