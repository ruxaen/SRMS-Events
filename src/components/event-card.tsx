"use client";

import Link from "next/link";
import Image from "next/image";
import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getCategoryColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

interface EventCardProps {
  event: Event;
  variant?: "featured" | "default";
  registrationCount?: number;
}

export default function EventCard({
  event,
  variant = "default",
  registrationCount,
}: EventCardProps) {
  if (variant === "featured") {
    return (
      <Link href={`/events/${event.id}`}>
        <div className="group relative rounded-2xl overflow-hidden h-[280px] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
          {/* Background Image */}
          <div className="absolute inset-0">
            {event.image_url ? (
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-maroon to-maroon-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          </div>

          {/* Content overlay */}
          <div className="relative h-full flex flex-col justify-between p-5">
            <div>
              <Badge className={`${getCategoryColor(event.category)} text-xs font-medium`}>
                {event.category}
              </Badge>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gray-100">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-white/70 text-sm mb-3 line-clamp-1">
                  {event.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-white/80 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(event.event_date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {event.capacity}
                </span>
              </div>
            </div>
          </div>

          {/* Arrow button */}
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-maroon rounded-full flex items-center justify-center text-white group-hover:bg-maroon-dark transition-colors">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative h-40 bg-gray-100">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={`${getCategoryColor(event.category)} text-xs font-medium`}>
              {event.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-maroon transition-colors line-clamp-1">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(event.event_date)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-400 text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue}
              </span>
              {registrationCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {registrationCount}/{event.capacity}
                </span>
              )}
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-maroon group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
