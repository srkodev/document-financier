
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceStatus, TransactionStatus } from "@/types";

interface StatusBadgeProps {
  status: InvoiceStatus | TransactionStatus;
  className?: string;
}

const statusConfig = {
  [InvoiceStatus.PENDING]: {
    color: "bg-status-pending text-white",
    label: "En attente"
  },
  [InvoiceStatus.APPROVED]: {
    color: "bg-status-approved text-white",
    label: "Approuvé"
  },
  [InvoiceStatus.REJECTED]: {
    color: "bg-status-rejected text-white",
    label: "Refusé"
  },
  [InvoiceStatus.PROCESSING]: {
    color: "bg-status-processing text-white",
    label: "En cours"
  },
  [TransactionStatus.PENDING]: {
    color: "bg-status-pending text-white",
    label: "En attente"
  },
  [TransactionStatus.COMPLETED]: {
    color: "bg-status-approved text-white",
    label: "Terminé"
  },
  [TransactionStatus.CANCELLED]: {
    color: "bg-status-rejected text-white",
    label: "Annulé"
  },
  [TransactionStatus.PROCESSING]: {
    color: "bg-status-processing text-white",
    label: "En cours"
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || {
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
