import { useState, useRef, type ReactNode } from "react";
import {
  alpha,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Grow,
  Popper,
  ClickAwayListener,
  Box,
} from "@mui/material";
import CustomInput from "./CustomInput";

const DE_BLUE = '#0052CC'

export interface DropdownItem {
  key: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  onSelect: (key: string) => void;
  value?: string;
  placeholder?: string;
  helperText?: string;
}

export default function CustomSelectSearchable({
  label,
  items,
  onSelect,
  value,
  placeholder,
  helperText,
}: DropdownMenuProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedItem = items.find((item) => item?.key === value);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event?: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      event?.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleSelect = (key: string) => {
    onSelect(key);
    setSearchText("");
    setOpen(false);
  };

  return (
    <Box>
      <div ref={anchorRef}>
        <CustomInput
          label={label}
          fullWidth
          value={searchText || selectedItem?.label || ""}
          placeholder={placeholder}
          onClick={handleToggle}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!open) setOpen(true);
          }}
        />
      </div>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "top left" }}>
            <Box>
              {open && (
                <ClickAwayListener onClickAway={handleClose}>
                  <Paper
                    elevation={4}
                    sx={{
                      width: anchorRef.current?.offsetWidth || 250,
                      maxHeight: 280,
                      overflowY: 'auto',
                      borderRadius: 1,
                      mt: 1,
                      border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
                      boxShadow: `0 12px 32px ${alpha(DE_BLUE, 0.12)}`,
                    }}
                  >
                    <List disablePadding>
                      {filteredItems.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#6B778C' }}>
                            No options found
                          </Typography>
                        </Box>
                      ) : (
                        filteredItems.map((item) => {
                          const isSelected = item.key === value
                          return (
                            <ListItemButton
                              key={item.key}
                              onClick={() => handleSelect(item.key)}
                              sx={{
                                py: 1.2,
                                px: 1.8,
                                borderBottom: `1px solid ${alpha(DE_BLUE, 0.05)}`,
                                '&:last-child': { borderBottom: 'none' },
                                bgcolor: isSelected ? alpha(DE_BLUE, 0.06) : 'transparent',
                                color: isSelected ? DE_BLUE : 'inherit',
                                '&:hover': {
                                  bgcolor: alpha(DE_BLUE, 0.04),
                                  '& .MuiListItemText-primary': { color: DE_BLUE },
                                },
                              }}
                            >
                              {item.icon && (
                                <ListItemIcon
                                  sx={{
                                    minWidth: 32,
                                    color: isSelected ? DE_BLUE : '#42526E',
                                  }}
                                >
                                  {item.icon}
                                </ListItemIcon>
                              )}
                              <ListItemText
                                primary={item.label}
                                secondary={item.description}
                                primaryTypographyProps={{
                                  fontSize: '0.88rem',
                                  fontWeight: isSelected ? 800 : 600,
                                  color: isSelected ? DE_BLUE : '#172B4D',
                                }}
                                secondaryTypographyProps={{
                                  fontSize: '0.75rem',
                                  color: alpha('#42526E', 0.7),
                                  mt: 0.2,
                                }}
                              />
                            </ListItemButton>
                          )
                        })
                      )}
                    </List>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Grow>
        )}
      </Popper>

      {helperText && (
        <Box mt={0.5}>
          <Typography
            variant="caption"
            sx={{
              color: '#6b6b6b',
              fontSize: '0.8rem',
              fontStyle: 'italic',
            }}
          >
            {helperText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
