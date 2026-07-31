import { AppRouter } from '@/routes/AppRouter';
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
