import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Map as MapIcon,
  Photo as PhotoIcon,
  Message as MessageIcon,
  AdminPanelSettings as AdminIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: `${theme.palette.secondary.dark} !important`
}));

const StyledToolbar = styled(Toolbar)({
  justifyContent: 'space-between'
});

const NavButton = styled(Button)(({ theme }) => ({
  color: `${theme.palette.background.default} !important`,
  margin: `0 ${theme.spacing(1)} !important`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
}));

const LogoLink = styled(RouterLink)(({ theme }) => ({
  color: theme.palette.background.default,
  textDecoration: 'none',
  fontWeight: 'bold',
  '&:hover': {
    color: theme.palette.primary.light
  }
}));

const NavActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.background.default,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
}));

const navItems = [
  { text: 'Map', icon: <MapIcon />, path: '/map' },
  { text: 'Photos', icon: <PhotoIcon />, path: '/photos' },
  { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
  { text: 'Analyze', icon: <BarChartIcon />, path: '/analyze' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Typography variant="h6" component={LogoLink} to="/">
          DankNet
        </Typography>

        <NavActions>
          {navItems.map((item) => (
            <NavButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              startIcon={item.icon}
            >
              {item.text}
            </NavButton>
          ))}
          {user?.role === 'admin' && (
            <NavButton
              component={RouterLink}
              to="/admin"
              startIcon={<AdminIcon />}
            >
              Admin
            </NavButton>
          )}
          <StyledIconButton
            size="large"
            onClick={handleMenu}
            aria-label="account menu"
          >
            <AccountCircle />
          </StyledIconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </NavActions>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar;
