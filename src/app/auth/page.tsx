import LoginPage from '@/components/admin/auth'


export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const page = () => {
  return (
    <div>
      <LoginPage />
    </div>
  )
}

export default page