import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SurferForm from './SurferForm';
import surferService from '../../services/surferService';

const headCells = [
  { id: 'name', label: 'Nome', sortable: true },
  { id: 'email', label: 'E-mail', sortable: true },
  { id: 'level', label: 'Nível', sortable: true },
  { id: 'stance', label: 'Base', sortable: true },
  { id: 'createdAt', label: 'Cadastrado em', sortable: true },
  { id: 'actions', label: 'Ações', sortable: false }
];

const EnhancedTableHead = ({ order, orderBy, onRequestSort }) => {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ fontWeight: 'bold' }}
          >
            {headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const SurferList = () => {
  const [surfers, setSurfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedSurfer, setSelectedSurfer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surferToDelete, setSurferToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSurferId, setSelectedSurferId] = useState(null);
  const navigate = useNavigate();

  const loadSurfers = async () => {
    try {
      setLoading(true);
      const data = await surferService.getAll();
      setSurfers(data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar surfistas:', error);
      setError('Não foi possível carregar a lista de surfistas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurfers();
  }, []);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleOpenMenu = (event, surferId) => {
    setAnchorEl(event.currentTarget);
    setSelectedSurferId(surferId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSurferId(null);
  };

  const handleEdit = (surfer) => {
    setSelectedSurfer(surfer);
    setOpenForm(true);
    handleCloseMenu();
  };

  const handleDeleteClick = (surfer) => {
    setSurferToDelete(surfer);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!surferToDelete) return;
    
    setIsDeleting(true);
    try {
      await surferService.delete(surferToDelete.id);
      setSurfers(surfers.filter(s => s.id !== surferToDelete.id));
      setDeleteDialogOpen(false);
      setSurferToDelete(null);
      // Mostrar mensagem de sucesso
    } catch (error) {
      console.error('Erro ao excluir surfista:', error);
      // Mostrar mensagem de erro
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (surferData) => {
    try {
      if (selectedSurfer) {
        // Atualizar surfista existente
        const updatedSurfer = await surferService.update(selectedSurfer.id, surferData);
        setSurfers(surfers.map(s => s.id === updatedSurfer.id ? updatedSurfer : s));
      } else {
        // Criar novo surfista
        const newSurfer = await surferService.create(surferData);
        setSurfers([...surfers, newSurfer]);
      }
      setOpenForm(false);
      setSelectedSurfer(null);
      // Mostrar mensagem de sucesso
    } catch (error) {
      console.error('Erro ao salvar surfista:', error);
      // Mostrar mensagem de erro
    }
  };

  const filteredSurfers = surfers.filter((surfer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      surfer.name.toLowerCase().includes(searchLower) ||
      surfer.email.toLowerCase().includes(searchLower) ||
      (surfer.phone && surfer.phone.includes(searchTerm))
    );
  });

  const sortedSurfers = filteredSurfers.sort((a, b) => {
    let comparison = 0;
    if (a[orderBy] > b[orderBy]) {
      comparison = 1;
    } else if (a[orderBy] < b[orderBy]) {
      comparison = -1;
    }
    return order === 'asc' ? comparison : -comparison;
  });

  const paginatedSurfers = sortedSurfers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      let date;
      
      // Se for string no formato ISO (2023-10-21T00:00:00.000Z)
      if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString);
      } 
      // Se for string no formato dd/MM/yyyy
      else if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } 
      // Se já for um objeto Date
      else if (dateString instanceof Date) {
        date = dateString;
      } 
      // Se for timestamp
      else if (typeof dateString === 'number') {
        date = new Date(dateString);
      }
      
      // Verifica se a data é válida
      if (!date || isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString);
        return 'Data inválida';
      }
      
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Data inválida';
    }
  };

  const getLevelLabel = (level) => {
    const levels = {
      'BEGINNER': 'Iniciante',
      'INTERMEDIATE': 'Intermediário',
      'ADVANCED': 'Avançado',
      'PROFESSIONAL': 'Profissional'
    };
    return levels[level] || level;
  };

  const getStanceLabel = (stance) => {
    if (!stance) return 'Não informado';
    const stances = {
      'REGULAR': 'Regular (pé esquerdo à frente)',
      'GOOFY': 'Goofy (pé direito à frente)'
    };
    return stances[stance] || stance;
  };

  if (loading && surfers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Surfistas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', maxWidth: '600px' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={searchTerm}
              onChange={handleSearch}
              fullWidth
              sx={{
                minWidth: '300px',
                '& .MuiOutlinedInput-root': {
                  paddingLeft: '8px',
                },
                '& .MuiInputBase-input': {
                  padding: '8.5px 14px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
            >
              Novo Surfista
            </Button>
          </Box>
        </Toolbar>

        <TableContainer>
          <Table>
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {paginatedSurfers.length > 0 ? (
                paginatedSurfers.map((surfer) => (
                  <TableRow hover key={surfer.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">{surfer.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {surfer.cpf}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{surfer.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getLevelLabel(surfer.level)} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getStanceLabel(surfer.stance)}</TableCell>
                    <TableCell>{formatDate(surfer.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, surfer.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl && selectedSurferId === surfer.id)}
                        onClose={handleCloseMenu}
                      >
                        <MenuItem onClick={() => handleEdit(surfer)}>
                          <ListItemIcon>
                            <EditIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary="Editar" />
                        </MenuItem>
                        <MenuItem onClick={() => handleDeleteClick(surfer)}>
                          <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                          </ListItemIcon>
                          <ListItemText primary="Excluir" primaryTypographyProps={{ color: 'error' }} />
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    Nenhum surfista encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSurfers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Paper>

      {/* Formulário de edição/criação */}
      <Dialog 
        open={openForm} 
        onClose={() => {
          setOpenForm(false);
          setSelectedSurfer(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSurfer ? 'Editar Surfista' : 'Novo Surfista'}
        </DialogTitle>
        <DialogContent dividers>
          <SurferForm
            surfer={selectedSurfer}
            onSave={handleFormSubmit}
            onCancel={() => {
              setOpenForm(false);
              setSelectedSurfer(null);
            }}
            loading={false}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o surfista {surferToDelete?.name}? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurferList;
