// TablesTableRow.jsx
import { Td, Tr, useColorModeValue } from '@chakra-ui/react'

const TablesTableRow = ({
  row,
  columnKeys,
  renderers = {},
  renderActions,
  columnWidths = {},
  isScrolled, // pass from parent
  checkboxComponent,
  actionsStickyLeft = false,
  hasCheckbox = false,
  actionsColumnWidth = '180px',
  stickyDivider,
  stickyShadow,
  stickyRightColumnKeys = [],
  stickyRightOffsets = {},
}) => {
  const bg = useColorModeValue('white', 'gray.800')

  return (
    <Tr>
      {checkboxComponent}
      {columnKeys.map((key, idx) => {
        const value = row[key]
        const content = renderers[key] ? renderers[key](value, row) : value
        const isLastDataColumn = idx === columnKeys.length - 1

        return (
          <Td
            key={idx}
            ps={8}
            pe={isLastDataColumn && renderActions ? 10 : 8}
            minW={columnWidths[key] || 'auto'}
            maxW={columnWidths[key] || 'auto'}
            overflow="visible"
            position={stickyRightColumnKeys.includes(key) ? 'sticky' : 'static'}
            right={stickyRightColumnKeys.includes(key) ? stickyRightOffsets[key] || 0 : undefined}
            zIndex={stickyRightColumnKeys.includes(key) ? 2 : undefined}
            bg={stickyRightColumnKeys.includes(key) ? bg : undefined}
            boxShadow={
              stickyRightColumnKeys.includes(key) && (stickyRightOffsets[key] || 0) === 0
                ? '-6px 0 10px rgba(13, 59, 142, 0.08)'
                : undefined
            }
          >
            {content ?? '—'}
          </Td>
        )
      })}

      {renderActions && (
        <Td
          px={8}
          minW={actionsColumnWidth}
          w={actionsColumnWidth}
          bg={bg}
          position="sticky"
          {...(actionsStickyLeft ? { left: hasCheckbox ? 56 : 0 } : { right: 0 })}
          zIndex={3}
          overflow="visible"
          whiteSpace="nowrap"
          borderLeft="1px solid"
          borderColor={stickyDivider}
          boxShadow={stickyShadow}
        >
          {renderActions(row)}
        </Td>
      )}
    </Tr>
  )
}

export default TablesTableRow
