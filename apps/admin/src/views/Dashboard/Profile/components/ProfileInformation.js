import { CopyIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  Tooltip,
  useClipboard,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import AssignPlanInline from 'components/UserDetails/AssignPlanInline'
import { useApproveUser, useResetUserPassword } from 'hooks/useUser'
import { useState } from 'react'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

const StatusIcon = ({ status }) =>
  status ? (
    <Icon as={FaCheckCircle} color="green.400" ml="5px" />
  ) : (
    <Icon as={FaTimesCircle} color="red.400" ml="5px" />
  )

const InfoGrid = ({ items }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const labelColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={10} spacingY={3} width="100%">
      {items?.map(({ label, value, highlight, isStatus, extra }) => (
        <Flex
          key={label}
          align={{ base: 'flex-start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={1}
          minW="0"
        >
          <Text
            fontSize="sm"
            color={labelColor}
            fontWeight="600"
            minW={{ base: 'auto', sm: '120px' }}
            maxW={{ base: '100%', sm: '120px' }}
            flexShrink={0}
            whiteSpace={{ base: 'normal', sm: 'nowrap' }}
            wordBreak="break-word"
            overflowWrap="break-word"
          >
            {label}:
          </Text>

          {isStatus ? (
            <StatusIcon status={value} />
          ) : (
            <Text
              fontSize="sm"
              color={highlight ? textColor : 'gray.500'}
              fontWeight={highlight ? 'bold' : '400'}
              maxW="100%"
              overflowWrap="break-word"
              wordBreak="break-word"
              whiteSpace="normal"
              flexGrow={1}
              display="flex"
              alignItems="center"
              gap={2}
            >
              {value || '—'}
              {extra ?? null}
            </Text>
          )}
        </Flex>
      ))}
    </SimpleGrid>
  )
}

const ProfileInformation = ({ user }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const toast = useToast()

  const approveUserMutation = useApproveUser()
  const resetPasswordMutation = useResetUserPassword()
  const [tempPassword, setTempPassword] = useState('')
  const { hasCopied, onCopy } = useClipboard(tempPassword || '')

  const handleApprove = () => approveUserMutation.mutate(user?.userId)
  const handleResetPassword = () => {
    resetPasswordMutation.mutate(user?.userId, {
      onSuccess: (tempPwd) => {
        setTempPassword(tempPwd)
        toast({
          title: 'Password Reset Successful',
          description: 'Temporary password generated.',
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
      },
      onError: (error) => {
        toast({
          title: 'Password Reset Failed',
          description: error?.response?.data?.message || error.message || 'Try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      },
    })
  }

  const accountSummaryItems = [
    { label: 'Email', value: user?.email },
    { label: 'Email Verified', value: user?.emailVerified, isStatus: true },
    { label: 'Phone', value: user?.phone },
    { label: 'Phone Verified', value: user?.phoneVerified, isStatus: true },
    { label: 'Role', value: user?.role },
    {
      label: 'Approved',
      value: user?.approved ? 'Yes' : 'No',
      extra: user?.approved ? null : (
        <Button
          size="sm"
          colorScheme="green"
          onClick={handleApprove}
          isLoading={approveUserMutation.isPending}
          loadingText="Approving"
        >
          Approve
        </Button>
      ),
    },
  ]

  const activityItems = [
    { label: 'Monthly Orders', value: user?.monthlyOrderCount },
    {
      label: 'Business Type',
      value: Array.isArray(user?.businessType) ? user.businessType.join(', ') : user?.businessType,
    },
    {
      label: 'Created At',
      value: user?.submittedAt ? new Date(user.submittedAt).toLocaleString() : '—',
    },
    {
      label: 'Last Updated',
      value: user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—',
    },
  ]

  return (
    <Flex direction="column" gap={6} width="100%">
      {/* Row 1: Account Summary + Assigned Plan */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
        <Card gridColumn={{ base: 'auto', md: 'span 3' }}>
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              Account Summary
            </Text>
          </CardHeader>
          <CardBody px="5px">
            <InfoGrid items={accountSummaryItems} />
          </CardBody>
        </Card>

        <Card maxW={{ base: '100%', md: '400px' }}>
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              Assigned Plan
            </Text>
          </CardHeader>
          <CardBody px="5px">
            <AssignPlanInline userId={user?.userId} currentPlanId={user?.currentPlanId} />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Row 2: Reset Password + KYC & Compliance */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card>
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              Reset Account Password
            </Text>
          </CardHeader>
          <CardBody px="5px" display="flex" flexDirection="column" gap={2}>
            <Button
              colorScheme="purple"
              onClick={handleResetPassword}
              isLoading={resetPasswordMutation.isPending}
              loadingText="Resetting"
              width="100%"
            >
              Reset Password
            </Button>

            {tempPassword && (
              <Flex alignItems={'center'}>
                <Text
                  fontSize="sm"
                  color="purple.600"
                  fontWeight="bold"
                  mt={2}
                  wordBreak="break-word"
                >
                  Temporary Password: {tempPassword}
                </Text>
                <Tooltip label={hasCopied ? 'Copied!' : 'Copy Temporary Password'}>
                  <IconButton
                    icon={<CopyIcon />}
                    size="xs"
                    ml={2}
                    variant="ghost"
                    onClick={onCopy}
                    aria-label="Copy Temp Password"
                  />
                </Tooltip>
              </Flex>
            )}
          </CardBody>
        </Card>

        <Card gridColumn={{ base: 'auto', md: 'span 2' }}>
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              KYC & Compliance
            </Text>
          </CardHeader>
          <CardBody px="5px">
            <Flex direction="column" align="center" gap={2} maxW="100%" overflow="hidden">
              <Text
                fontSize="sm"
                color={labelColor}
                fontWeight="600"
                minW="120px"
                maxW="120px"
                flexShrink={0}
                whiteSpace="normal"
                wordBreak="break-word"
                overflowWrap="break-word"
              >
                Domestic KYC Status:
              </Text>
              <StatusBadge
                status={user?.domesticKyc?.status}
                type={
                  user?.domesticKyc?.status === 'verification_in_progress'
                    ? 'info'
                    : user?.domesticKyc?.status === 'pending'
                    ? 'warning'
                    : user?.domesticKyc?.status === 'verified'
                    ? 'success'
                    : 'error'
                }
              />
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Activity Section */}
      <Card>
        <CardHeader p="12px 5px" mb="12px">
          <Text fontSize="lg" color={textColor} fontWeight="bold">
            Activity
          </Text>
        </CardHeader>
        <CardBody px="5px">
          <InfoGrid items={activityItems} />
        </CardBody>
      </Card>
    </Flex>
  )
}

export default ProfileInformation
