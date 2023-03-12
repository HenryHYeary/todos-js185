--
-- PostgreSQL database dump
--

-- Dumped from database version 13.10 (Ubuntu 13.10-1.pgdg20.04+1)
-- Dumped by pg_dump version 13.10 (Ubuntu 13.10-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: todolists; Type: TABLE; Schema: public; Owner: henmo
--

CREATE TABLE public.todolists (
    id integer NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.todolists OWNER TO henmo;

--
-- Name: todolists_id_seq; Type: SEQUENCE; Schema: public; Owner: henmo
--

CREATE SEQUENCE public.todolists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.todolists_id_seq OWNER TO henmo;

--
-- Name: todolists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: henmo
--

ALTER SEQUENCE public.todolists_id_seq OWNED BY public.todolists.id;


--
-- Name: todos; Type: TABLE; Schema: public; Owner: henmo
--

CREATE TABLE public.todos (
    id integer NOT NULL,
    title text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    todolist_id integer NOT NULL
);


ALTER TABLE public.todos OWNER TO henmo;

--
-- Name: todos_id_seq; Type: SEQUENCE; Schema: public; Owner: henmo
--

CREATE SEQUENCE public.todos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.todos_id_seq OWNER TO henmo;

--
-- Name: todos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: henmo
--

ALTER SEQUENCE public.todos_id_seq OWNED BY public.todos.id;


--
-- Name: todolists id; Type: DEFAULT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todolists ALTER COLUMN id SET DEFAULT nextval('public.todolists_id_seq'::regclass);


--
-- Name: todos id; Type: DEFAULT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todos ALTER COLUMN id SET DEFAULT nextval('public.todos_id_seq'::regclass);


--
-- Data for Name: todolists; Type: TABLE DATA; Schema: public; Owner: henmo
--

INSERT INTO public.todolists VALUES (1, 'Work Todos');
INSERT INTO public.todolists VALUES (2, 'Home Todos');
INSERT INTO public.todolists VALUES (3, 'Additional Todos');
INSERT INTO public.todolists VALUES (4, 'social todos');


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: henmo
--

INSERT INTO public.todos VALUES (1, 'Get Coffee', true, 1);
INSERT INTO public.todos VALUES (2, 'Chat with co-workers', true, 1);
INSERT INTO public.todos VALUES (3, 'Duck out of meeting', false, 1);
INSERT INTO public.todos VALUES (4, 'Feed the cats', true, 2);
INSERT INTO public.todos VALUES (5, 'Go to bed', true, 2);
INSERT INTO public.todos VALUES (6, 'Buy milk', true, 2);
INSERT INTO public.todos VALUES (7, 'Study for Launch School', true, 2);
INSERT INTO public.todos VALUES (8, 'Go to Libby''s birthday party', false, 4);


--
-- Name: todolists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: henmo
--

SELECT pg_catalog.setval('public.todolists_id_seq', 4, true);


--
-- Name: todos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: henmo
--

SELECT pg_catalog.setval('public.todos_id_seq', 8, true);


--
-- Name: todolists todolists_pkey; Type: CONSTRAINT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todolists
    ADD CONSTRAINT todolists_pkey PRIMARY KEY (id);


--
-- Name: todolists todolists_title_key; Type: CONSTRAINT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todolists
    ADD CONSTRAINT todolists_title_key UNIQUE (title);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: todos todos_todolist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: henmo
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_todolist_id_fkey FOREIGN KEY (todolist_id) REFERENCES public.todolists(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

