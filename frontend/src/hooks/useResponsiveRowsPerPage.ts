import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export const useResponsiveRowsPerPage = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900-1200px
  const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 1200-1536px
  const isXl = useMediaQuery(theme.breakpoints.up('xl')); // > 1536px

  const getDefaultRowsPerPage = () => {
    if (isXs) return 5;
    if (isSm) return 10;
    if (isMd) return 15;
    if (isLg) return 20;
    if (isXl) return 25;
    return 10;
  };

  const getRowsPerPageOptions = () => {
    if (isXs) return [5, 10, 15];
    if (isSm) return [5, 10, 15, 20];
    if (isMd) return [10, 15, 20, 25];
    if (isLg) return [15, 20, 25, 30];
    if (isXl) return [20, 25, 30, 50];
    return [5, 10, 25];
  };

  return {
    defaultRowsPerPage: getDefaultRowsPerPage(),
    rowsPerPageOptions: getRowsPerPageOptions()
  };
};