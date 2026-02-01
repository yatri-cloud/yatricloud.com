import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginSignup } from "@/components/certified-yatris/LoginSignup";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    title?: string;
    description?: string;
}

export const LoginModal = ({ isOpen, onClose, onSuccess, title, description }: LoginModalProps) => {
    const handleSuccess = (user: any) => {
        onSuccess(user);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 bg-transparent border-none">
                <LoginSignup onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
};
