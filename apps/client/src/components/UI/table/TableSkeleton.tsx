import React from "react";
import {
  Box,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";

interface SkeletonDataTableProps {
  rowCount?: number;
  colCount?: number;
  title?: string;
  subTitle?: string;
}

const TableSkeleton: React.FC<SkeletonDataTableProps> = ({
  rowCount = 5,
  colCount = 5,
  title = "Loading Data...",
  subTitle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const columns = Array.from({ length: colCount });
  const rows = Array.from({ length: rowCount });

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Stack spacing={0.5} mb={2}>
        <Typography
          fontWeight={600}
          fontSize={{ xs: "17px", sm: "19px" }}
          color="primary.contrastText"
        >
          {title}
        </Typography>
        {subTitle && (
          <Typography fontSize="13px" color="text.secondary">
            {subTitle}
          </Typography>
        )}
      </Stack>

      {isMobile ? (
        <Stack spacing={2}>
          {rows.map((_, rowIdx) => (
            <Box
              key={rowIdx}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.05)",
                p: 2,
              }}
            >
              <Stack spacing={1}>
                {columns.map((__, colIdx) => (
                  <Skeleton
                    key={colIdx}
                    variant="text"
                    width="80%"
                    height={18}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ background: "transparent" }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton variant="text" width={80} height={18} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((__, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton variant="text" width="90%" height={14} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TableSkeleton;
