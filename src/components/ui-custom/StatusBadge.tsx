
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceStatus, TransactionStatus } from "@/types";

interface StatusBadgeProps {
  status: InvoiceStatus | TransactionStatus;
  className?: string;
}

const statusConfig = {
  // Invoice statuses
  [InvoiceStatus.PENDING]: {
    color: "bg-status-pending text-white",
    label: "En attente"
  },
  [InvoiceStatus.PAID]: {
    color: "bg-status-approved text-white",
    label: "Approuvé"
  },
  [InvoiceStatus.REJECTED]: {
    color: "bg-status-rejected text-white",
    label: "Refusé"
  },
  [InvoiceStatus.DRAFT]: {
    color: "bg-gray-500 text-white",
    label: "Brouillon"
  },
  // Transaction statuses - using unique identifiers
  [`transaction_${TransactionStatus.PENDING}`]: {
    color: "bg-status-pending text-white",
    label: "En attente"
  },
  [`transaction_${TransactionStatus.COMPLETED}`]: {
    color: "bg-status-approved text-white",
    label: "Terminé"
  },
  [`transaction_${TransactionStatus.CANCELLED}`]: {
    color: "bg-status-rejected text-white",
    label: "Annulé"
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  // Check if it's a transaction status and use the appropriate key
  const configKey = Object.values(TransactionStatus).includes(status as TransactionStatus)
    ? `transaction_${status}`
    : status;
    
  const config = statusConfig[configKey as keyof typeof statusConfig] || {
    color: "bg-gray-500 text-white",
    label: status
  };

  return (
    <Badge
      className={cn(
        "px-3 py-1 font-medium transition-all duration-200",
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
