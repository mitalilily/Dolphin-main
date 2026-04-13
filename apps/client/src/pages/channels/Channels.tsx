import { Stack } from '@mui/material'
import AllChannelOptions from '../../components/channels/AllChannelOptions'
import UserConnectedChannels from '../../components/channels/UserConnectedChannels'
import PageHeading from '../../components/UI/heading/PageHeading'

const Channels = () => {
  return (
    <Stack spacing={4}>
      <PageHeading
        eyebrow="Channels Panel"
        title="Channels"
        subtitle="Connect storefronts, review existing integrations, and keep order sync for your team."
      />
      <UserConnectedChannels />
      <AllChannelOptions />
    </Stack>
  )
}

export default Channels
