export interface NavItemProps {
  text: string;
  onClick?: () => void;
}

export interface SocialMediaProps {
  icon: string;
  text: string;
  onClick?: () => void;
}

export interface WalletControlsProps {
  selectIcon: string;
  onSelect?: () => void;
  onDisconnect?: () => void;
}