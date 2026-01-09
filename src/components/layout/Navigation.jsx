import React from 'react';
import { AppBar, Toolbar, Typography, Breadcrumbs, Link, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function Navigation() {
  const location = useLocation();
  
  // Parse current path for breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: 'Home',
        path: '/',
        icon: <HomeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />,
      },
    ];

    if (pathSegments.length > 0) {
      if (pathSegments[0] === 'conversation' && pathSegments[1]) {
        breadcrumbs.push({
          label: `Conversation ${pathSegments[1]}`,
          path: `/conversation/${pathSegments[1]}`,
        });
      } else if (pathSegments[0] === 'turns' && pathSegments[1]) {
        breadcrumbs.push({
          label: `Conversation ${pathSegments[1]}`,
          path: `/conversation/${pathSegments[1]}`,
        });
        breadcrumbs.push({
          label: 'Turn Analysis',
          path: `/turns/${pathSegments[1]}`,
        });
      } else if (pathSegments[0] === 'compare') {
        breadcrumbs.push({
          label: 'Compare',
          path: '/compare',
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography 
            variant="h6" 
            component={RouterLink}
            to="/"
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
              mr: 3,
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          >
            Conversation Dynamics
          </Typography>

          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              if (isLast) {
                return (
                  <Typography
                    key={crumb.path}
                    color="text.primary"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '0.875rem',
                    }}
                  >
                    {crumb.icon}
                    {crumb.label}
                  </Typography>
                );
              }

              return (
                <Link
                  key={crumb.path}
                  component={RouterLink}
                  to={crumb.path}
                  underline="hover"
                  color="inherit"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '0.875rem',
                  }}
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;

