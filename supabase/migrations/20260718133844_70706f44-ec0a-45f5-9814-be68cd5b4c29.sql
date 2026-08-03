
CREATE OR REPLACE FUNCTION public.finalize_sync_render(
  _user_id uuid,
  _prompt text,
  _kind text,
  _mode text,
  _input_images jsonb,
  _audio_url text,
  _model text,
  _result_image_url text,
  _result_video_url text,
  _result_text text,
  _credits_cost integer,
  _session_id uuid,
  _agent_shot_id text,
  _amount integer,
  _reason text,
  _ref uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gen_id uuid;
BEGIN
  INSERT INTO public.generations (
    user_id, prompt, kind, mode, status, input_images, audio_url, model,
    result_image_url, result_video_url, result_text, credits_cost,
    session_id, agent_shot_id
  ) VALUES (
    _user_id, _prompt, _kind, COALESCE(_mode,'performance'), 'succeeded',
    COALESCE(_input_images,'[]'::jsonb), _audio_url, _model,
    _result_image_url, _result_video_url, _result_text, _credits_cost,
    _session_id, _agent_shot_id
  ) RETURNING id INTO _gen_id;

  PERFORM public.commit_reservation(_user_id, _amount, _reason, _ref);
  RETURN _gen_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_sync_render(uuid,text,text,text,jsonb,text,text,text,text,text,integer,uuid,text,integer,text,uuid) TO service_role, authenticated;
