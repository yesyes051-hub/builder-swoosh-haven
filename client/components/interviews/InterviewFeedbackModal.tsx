import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  SubmitFeedbackRequest,
  ApiResponse,
  InterviewFeedback,
} from "@shared/api";
import { Loader2, Star } from "lucide-react";

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: {
    id: string;
    candidateId: string;
    candidate?: {
      firstName: string;
      lastName: string;
    };
    type: string;
    scheduledAt: Date;
  };
}

const ratingLabels = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export default function InterviewFeedbackModal({
  isOpen,
  onClose,
  interview,
}: InterviewFeedbackModalProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ratings, setRatings] = useState({
    communication: 3,
    confidence: 3,
    presenceOfMind: 3,
    interpersonalSkills: 3,
    bodyGesture: 3,
    technicalQuestionHandling: 3,
    codingElaboration: 3,
    energyInInterview: 3,
    analyticalThinking: 3,
  });

  const [writtenFeedback, setWrittenFeedback] = useState("");

  const handleRatingChange = (field: keyof typeof ratings, value: number[]) => {
    setRatings((prev) => ({
      ...prev,
      [field]: value[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!writtenFeedback.trim()) {
      toast.error("Written feedback is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: SubmitFeedbackRequest = {
        interviewId: interview.id,
        candidateId: interview.candidateId,
        ratings,
        writtenFeedback: writtenFeedback.trim(),
      };

      const response = await fetch("/api/interviews/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      const result: ApiResponse<InterviewFeedback> = await response.json();

      if (response.ok && result.success) {
        toast.success("Feedback submitted successfully!");
        onClose();
        // Reset form
        setRatings({
          communication: 3,
          confidence: 3,
          presenceOfMind: 3,
          interpersonalSkills: 3,
          bodyGesture: 3,
          technicalQuestionHandling: 3,
          codingElaboration: 3,
          energyInInterview: 3,
          analyticalThinking: 3,
        });
        setWrittenFeedback("");
      } else {
        toast.error(result.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred while submitting feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingField = ({
    label,
    field,
    value,
  }: {
    label: string;
    field: keyof typeof ratings;
    value: number;
  }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{value}</span>
          <span className="text-xs text-gray-500">
            ({ratingLabels[value as keyof typeof ratingLabels]})
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val) => handleRatingChange(field, val)}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>1 - Poor</span>
        <span>3 - Average</span>
        <span>5 - Excellent</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed-size-modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Interview Feedback
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {interview.candidate && (
              <>
                Candidate: {interview.candidate.firstName}{" "}
                {interview.candidate.lastName}
                <br />
              </>
            )}
            Interview Type: {interview.type} | Date:{" "}
            {new Date(interview.scheduledAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <RatingField
              label="Communication"
              field="communication"
              value={ratings.communication}
            />

            <RatingField
              label="Confidence"
              field="confidence"
              value={ratings.confidence}
            />

            <RatingField
              label="Presence of Mind"
              field="presenceOfMind"
              value={ratings.presenceOfMind}
            />

            <RatingField
              label="Interpersonal Skills"
              field="interpersonalSkills"
              value={ratings.interpersonalSkills}
            />

            <RatingField
              label="Body Gesture"
              field="bodyGesture"
              value={ratings.bodyGesture}
            />

            <RatingField
              label="Technical Question Handling"
              field="technicalQuestionHandling"
              value={ratings.technicalQuestionHandling}
            />

            <RatingField
              label="Coding Elaboration"
              field="codingElaboration"
              value={ratings.codingElaboration}
            />

            <RatingField
              label="Energy in Interview"
              field="energyInInterview"
              value={ratings.energyInInterview}
            />

            <RatingField
              label="Analytical Thinking"
              field="analyticalThinking"
              value={ratings.analyticalThinking}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="writtenFeedback" className="text-sm font-medium">
              Written Feedback *
            </Label>
            <Textarea
              id="writtenFeedback"
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement, and overall assessment..."
              className="min-h-[120px] resize-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !writtenFeedback.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
