import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { SearchOffRounded } from '@mui/icons-material';

export const NotFound: React.FC = () => {
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
          <SearchOffRounded sx={{ fontSize: 80, color: '#fcbf49', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1b4332', mb: 2 }}>
            404
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1b4332', mb: 2 }}>
            Página Não Encontrada
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Desculpe, a página que você está procurando não existe ou foi removida.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Ir para Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};