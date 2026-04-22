import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { ContentState, EditorState, convertFromHTML, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import { useEffect, useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { FiCheck, FiRefreshCcw, FiStar } from 'react-icons/fi'
import { useStaticPage, useUpdateStaticPage } from 'hooks/useStaticPage'
import api from 'services/axios'

const ABOUT_US_SLUG = 'about_us'

const AboutUsEditor = () => {
  const toast = useToast()
  const textColor = useColorModeValue('gray.700', 'white')
  const bgColor = useColorModeValue('gray.50', 'gray.800')

  const { data: page, isLoading } = useStaticPage(ABOUT_US_SLUG)
  const updatePageMutation = useUpdateStaticPage(ABOUT_US_SLUG)

  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (page?.content) {
      const blocksFromHTML = convertFromHTML(page.content)
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap,
      )
      setEditorState(EditorState.createWithContent(contentState))
      setContent(page.content)
    }
  }, [page])

  const handleLoadTemplate = () => {
    const templateHtml = `
      <h2>About Dolphin Enterprise</h2>
      <p><strong>Dolphin Enterprise</strong> is a modern shipping operations platform built for ecommerce sellers who want faster dispatch, lower courier costs, and a smoother post-purchase experience.</p>

      <h3>What We Do</h3>
      <ul>
        <li>Compare courier partners from one clean operations workspace</li>
        <li>Automate shipping, billing, reconciliation, and support flows</li>
        <li>Track every shipment across B2C and B2B order journeys</li>
      </ul>

      <h3>Why Brands Choose Us</h3>
      <ul>
        <li>One platform for shipping, finance visibility, and delivery follow-up</li>
        <li>Built for growing ecommerce teams that need better operational clarity</li>
        <li>Delightful branding and simple workflows that reduce panel fatigue</li>
      </ul>

      <h3>Contact</h3>
      <p><strong>Email:</strong> support@dolphinenterprise.com</p>
      <p><strong>Website:</strong> www.dolphinenterprise.com</p>
      <p><strong>Message:</strong> Ship smarter. Save more on every order.</p>
    `

    const blocksFromHTML = convertFromHTML(templateHtml)
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap,
    )
    setEditorState(EditorState.createWithContent(contentState))
    setContent(templateHtml)
  }

  const handleContentChange = (state) => {
    setEditorState(state)
    const html = draftToHtml(convertToRaw(state.getCurrentContent()))
    setContent(html)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!content.trim()) newErrors.content = 'Content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImageCallback = async (file) => {
    try {
      const { data } = await api.post('/uploads/presign', {
        contentType: file.type || 'image/*',
        filename: file.name,
        folder: 'about-us',
      })

      await api.put(data.uploadUrl, file, {
        headers: { 'Content-Type': file.type || 'image/*' },
      })

      return { data: { link: data.publicUrl } }
    } catch (err) {
      console.error('Image upload failed', err)
      toast({
        title: 'Image upload failed',
        description: 'Please try again or use a smaller image.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      return Promise.reject(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await updatePageMutation.mutateAsync({ title: 'About Us - Dolphin Enterprise', content })
      toast({
        title: 'About Us content saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to save About Us content',
        description: err?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }} bg={bgColor} minH="100vh" pb={10}>
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        position="sticky"
        top="0"
        zIndex="10"
        py={4}
        mb={6}
      >
        <Flex
          justify="space-between"
          align="center"
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 6 }}
        >
          <Box>
            <HStack spacing={2}>
              <Box color="brand.500">
                <FiStar />
              </Box>
              <Heading size="md" color={textColor}>
                About Us Page
              </Heading>
            </HStack>
            <HStack spacing={3} mt={1}>
              <Text fontSize="sm" color="gray.500">
                Manage the Dolphin Enterprise story shown on the customer support screen.
              </Text>
              {page?.updated_at && (
                <Badge colorScheme="green" variant="subtle" fontSize="0.7rem">
                  Last updated: {new Date(page.updated_at).toLocaleString()}
                </Badge>
              )}
            </HStack>
          </Box>

          <HStack spacing={3}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiRefreshCcw />}
              onClick={handleLoadTemplate}
              isDisabled={isLoading || updatePageMutation.isLoading}
            >
              Load Dolphin Enterprise Copy
            </Button>
            <Button
              colorScheme="brand"
              leftIcon={<FiCheck />}
              onClick={handleSubmit}
              isLoading={updatePageMutation.isLoading}
            >
              Save
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }}>
        {isLoading && (
          <Text color="gray.500" mb={4}>
            Loading current content...
          </Text>
        )}

        <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="flex-start">
          <Box flex="1">
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired isInvalid={errors.content}>
                  <FormLabel fontSize="sm" fontWeight="600" mb={3}>
                    About Us Content
                  </FormLabel>
                  <Box
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    borderRadius="md"
                    overflow="visible"
                    bg="white"
                  >
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={handleContentChange}
                      wrapperClassName="editor-wrapper"
                      editorClassName="editor"
                      toolbarClassName="editor-toolbar"
                      toolbar={{
                        options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'image', 'history'],
                        inline: { inDropdown: false },
                        list: { inDropdown: true },
                        textAlign: { inDropdown: true },
                        link: { inDropdown: true },
                        image: {
                          uploadCallback: uploadImageCallback,
                          previewImage: true,
                          alt: { present: true, mandatory: false },
                        },
                        history: { inDropdown: false },
                      }}
                      editorStyle={{ minHeight: '400px', padding: '16px' }}
                      placeholder="Write the About Us content shown to customers..."
                    />
                  </Box>
                  {errors.content && <FormErrorMessage>{errors.content}</FormErrorMessage>}
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length} words
                  </Text>
                </FormControl>
              </VStack>
            </form>
          </Box>

          <Box
            flex={{ base: '1', lg: '0 0 40%' }}
            borderWidth="1px"
            borderRadius="md"
            p={4}
            bg={useColorModeValue('white', 'gray.900')}
            maxH="620px"
            overflowY="auto"
          >
            <Text fontSize="sm" fontWeight="600" mb={2}>
              Live Preview
            </Text>
            <Box
              fontSize="sm"
              color={textColor}
              sx={{
                '& h1, & h2, & h3, & h4, & h5, & h6': { fontWeight: 600, mt: 2, mb: 1 },
                '& p': { mb: 1.5, lineHeight: 1.7 },
                '& ul, & ol': { pl: 4, mb: 2 },
                '& li': { mb: 0.5 },
              }}
              dangerouslySetInnerHTML={{ __html: content || '<p>Start writing to see preview here.</p>' }}
            />
          </Box>
        </Flex>
      </Box>
    </Box>
  )
}

export default AboutUsEditor
