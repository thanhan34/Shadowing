import type { GetServerSideProps } from 'next'

const AddAudioSampleAliasPage = () => null

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/AddAudioSample',
      permanent: false,
    },
  }
}

export default AddAudioSampleAliasPage
