import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { LockRounded } from '@mui/icons-material';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <LockRounded sx={{ fontSize: 80, color: '#d62828', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1b4332', mb: 2 }}>
            403
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1b4332', mb: 2 }}>
            Acesso Negado
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Você não tem permissão para acessar este recurso. Verifique suas credenciais ou entre em contato com o administrador.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Voltar ao Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
          >
            Fazer Login Novamente
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};